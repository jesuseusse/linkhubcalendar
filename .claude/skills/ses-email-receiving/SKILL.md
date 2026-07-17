---
name: ses-email-receiving
description: Configura un dominio en Amazon SES para recibir correo y reenviarlo automáticamente a otra casilla mediante S3 + Lambda + Route 53. Usar cuando el usuario pida "configurar recepción de correo en SES", "reenviar correo de mi dominio", o similar.
---

# Configurar recepción y reenvío de correo en Amazon SES

## Cuándo usar esta skill

El usuario tiene un dominio verificado en SES (solo para envío) y quiere que también
pueda **recibir** correo en una dirección de ese dominio, reenviándolo automáticamente
a otra casilla de email existente.

## Inputs a confirmar con el usuario antes de tocar nada

1. Dominio SES ya verificado (ej. `ejemplo.com`).
2. Dirección(es) que recibirán correo en ese dominio: una específica
   (`contacto@ejemplo.com`) o el dominio completo sin usuario para capturar
   cualquier dirección (wildcard).
3. Casilla destino donde se reenviará el correo (idealmente en un dominio ya
   verificado en SES, para evitar fricción de sandbox).
4. Nombre de bucket S3 (único globalmente) para guardar el correo crudo.

Presentar el plan completo y esperar confirmación explícita antes de crear recursos
nuevos (S3, Lambda, IAM, reglas SES, registros DNS).

## Pre-requisito

Verificar en **SES → Account Dashboard** que la cuenta esté en Production access
(fuera de sandbox). Si está en sandbox, el reenvío por `SendRawEmail` fallará hacia
destinatarios no verificados.

## Pasos (orden probado, evita retrabajo)

### 1. Rule set de recepción

SES → Email Receiving → Create rule set. Nombre libre
(ej. `<proyecto>-default-rules`). No activarlo todavía.

### 2. Bucket S3

Crear bucket (ej. `<proyecto>-inbound-mail`). Agregar bucket policy permitiendo a
`ses.amazonaws.com` hacer `PutObject`, condicionada por:

- `aws:SourceAccount` = Account ID del usuario
- `aws:SourceArn` = `arn:aws:ses:<region>:<account_id>:receipt-rule-set/*:receipt-rule/*`

### 3. Función Lambda (forwarder)

Crear función Node.js desde cero.

**IMPORTANTE — lección aprendida:** el editor de código embebido de la consola
Lambda (Monaco/VSCode web) tiende a congelarse y dejar de responder al teclado.
**No perder tiempo troubleshooteando esto.** Ir directo a **CloudShell** y desplegar
por CLI:

```bash
mkdir lambda-build && cd lambda-build
cat > index.mjs << 'EOF'
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";

const s3 = new S3Client({});
const ses = new SESClient({});
const BUCKET = process.env.BUCKET;
const PREFIX = process.env.PREFIX || "";
const FORWARD_TO = process.env.FORWARD_TO;
const FORWARD_FROM = process.env.FORWARD_FROM;

async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

export const handler = async (event) => {
  const record = event.Records[0];
  const messageId = record.ses.mail.messageId;
  const key = PREFIX + messageId;

  const getObj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const raw = await streamToString(getObj.Body);

  const headerEndIndex = raw.indexOf("\r\n\r\n");
  let headers = raw.substring(0, headerEndIndex);
  const body = raw.substring(headerEndIndex);

  // IMPORTANTE: reescribir TODOS los headers de identidad, no solo From/To.
  // SES valida Source + From + Return-Path (+ Sender) del mensaje crudo.
  // Si alguno queda con la dirección original no verificada, SES rechaza
  // el envío con "MessageRejected: Email address is not verified".
  headers = headers.replace(/^From:.*$/gim, "From: " + FORWARD_FROM);
  headers = headers.replace(/^To:.*$/gim, "To: " + FORWARD_TO);
  headers = headers.replace(/^Return-Path:.*$/gim, "Return-Path: <" + FORWARD_FROM + ">");
  headers = headers.replace(/^Sender:.*$/gim, "Sender: " + FORWARD_FROM);

  if (!/^Reply-To:/im.test(headers)) {
    const commonHeaders = record.ses.mail.commonHeaders || {};
    const originalFrom = commonHeaders.from ? commonHeaders.from.join(", ") : "";
    headers += "\r\nReply-To: " + originalFrom;
  }

  const newRawEmail = headers + body;

  await ses.send(new SendRawEmailCommand({
    Destinations: [FORWARD_TO],
    Source: FORWARD_FROM,
    RawMessage: { Data: Buffer.from(newRawEmail) }
  }));

  return { disposition: "STOP_RULE_SET" };
};
EOF
zip -r function.zip index.mjs
aws lambda update-function-code --function-name <NOMBRE_FN> \
  --zip-file fileb://function.zip --region <REGION>
aws lambda add-permission --function-name <NOMBRE_FN> \
  --statement-id AllowSESInvoke --action lambda:InvokeFunction \
  --principal ses.amazonaws.com --source-account <ACCOUNT_ID> --region <REGION>
```

Variables de entorno (vía consola, sin problema): `BUCKET`, `PREFIX=inbound/`,
`FORWARD_TO`, `FORWARD_FROM`.

### 4. IAM

Policy inline en el rol de ejecución de la Lambda: `s3:GetObject` (scoped al
bucket) y `ses:SendRawEmail` (Resource: `*`). Si el editor JSON de IAM da
problemas con brackets, usar el editor Visual.

### 5. Regla de recepción SES

Crear regla dentro del rule set: condición de destinatario (dirección específica
o dominio pelado para wildcard) + acciones en orden: 1) Deliver to S3 bucket, 2) Invoke Lambda function (Event/async).

### 6. Activar el rule set

"Set as active" en el rule set.

### 7. Registro MX en Route 53

`10 inbound-smtp.<region>.amazonaws.com`, TTL 300.

### 8. Prueba y verificación

Enviar un correo real. Revisar CloudWatch Logs `/aws/lambda/<NOMBRE_FN>` si no
llega — el error `MessageRejected: Email address is not verified` casi siempre
significa que un header de identidad (From/Return-Path/Sender) no se reescribió.
Se puede reprocesar un mensaje ya guardado en S3 sin esperar un reenvío real,
invocando la Lambda manualmente con un evento sintético:

```bash
aws lambda invoke --function-name <NOMBRE_FN> --region <REGION> \
  --payload '{"Records":[{"ses":{"mail":{"messageId":"<ID_DEL_OBJETO_S3>","commonHeaders":{"from":["origen@dominio.com"]}}}}]}' \
  /tmp/out.json && cat /tmp/out.json
```

## Errores comunes ya resueltos

- **Editor de código Lambda se congela en la consola** → usar CloudShell + CLI.
- **Editores JSON desalinean brackets** → escribir con cuidado o usar editor Visual.
- **Acción incorrecta seleccionada en la regla SES** → confirmar visualmente antes
  de continuar.
- **"MessageRejected: Email address is not verified" solo con ciertos remitentes**
  (ej. Facebook, pero no Gmail) → el correo crudo trae headers `Return-Path` y/o
  `Sender` con la dirección original, que SES también valida además de `From` y
  `Source`. Hay que reescribir/eliminar esos headers también, no solo `From`/`To`.
