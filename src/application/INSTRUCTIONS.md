# Application Layer Instructions

This layer contains **use cases** — the business logic that orchestrates domain entities and repository calls. Use cases depend only on domain interfaces (never on infrastructure directly).

## Folder Structure

```
src/application/
  use-cases/      # One file per feature area
```

## Creating a New Use Case

### Single use case per file

```ts
// src/application/use-cases/GetProductsUseCase.ts
import { IProductRepository } from "../../domain/interfaces/IProductRepository";
import { ProductResponseDto } from "../../domain/dtos/AuthDtos";

export class GetProductsUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(tenantId: string, userId: string): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.findByUserId(tenantId, userId);
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      createdAt: p.createdAt.toISOString(),
    }));
  }
}
```

### Multiple related use cases in one file

When use cases are tightly related (CRUD on the same resource), group them in one file:

```ts
// src/application/use-cases/ManageProductsUseCase.ts
import { IProductRepository } from "../../domain/interfaces/IProductRepository";
import { CreateProductDto, ProductResponseDto } from "../../domain/dtos/AuthDtos";

export class CreateProductUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(tenantId: string, userId: string, dto: CreateProductDto): Promise<ProductResponseDto> {
    const product = await this.productRepository.create(tenantId, {
      userId,
      name: dto.name,
      price: dto.price,
    });
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      createdAt: product.createdAt.toISOString(),
    };
  }
}

export class DeleteProductUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(tenantId: string, userId: string, productId: string): Promise<boolean> {
    return this.productRepository.deleteById(tenantId, productId);
  }
}
```

## Rules

1. **`tenantId: string` is always the first parameter of `execute()`** — this is mandatory for multi-tenant isolation
2. Pass `tenantId` to **every** repository/service call
3. Dependencies are injected via constructor (not imported directly)
4. Use cases return **DTOs**, never raw entities
5. Convert `Date` to ISO string in the return value
6. Throw descriptive `Error` messages for business rule violations
7. Imports use relative paths: `../../domain/interfaces/...`

## Signature Pattern

```
execute(tenantId: string, ...args): Promise<ResponseDto>
```

Examples from this codebase:
- `execute(tenantId, userId)` — get user's own data
- `execute(tenantId, userId, dto)` — update user's own data
- `execute(tenantId, username)` — public lookup by username
- `execute(tenantId, username, dto)` — public submission (leads, bookings)
- `execute(tenantId, userId, page, limit)` — paginated queries

## Registering in the Container

After creating a use case, register it in `src/infrastructure/container.ts`:

```ts
import { CreateProductUseCase } from '@/application/use-cases/ManageProductsUseCase';

// In the container object:
export const container = {
  // ... existing entries
  createProductUseCase: new CreateProductUseCase(productRepo),
};
```

## Existing Use Cases Reference

| Use Case | File | Signature |
|----------|------|-----------|
| `GetProfileUseCase` | `GetProfileUseCase.ts` | `execute(tenantId, userId)` |
| `UpdateProfileUseCase` | `UpdateProfileUseCase.ts` | `execute(tenantId, userId, dto)` |
| `UploadPhotoUseCase` | `UploadPhotoUseCase.ts` | `execute(tenantId, userId, file)` |
| `UpdateUsernameUseCase` | `UpdateUsernameUseCase.ts` | `execute(tenantId, userId, username)` |
| `UpdateThemeUseCase` | `UpdateThemeUseCase.ts` | `execute(tenantId, userId, dto)` |
| `ToggleContactFormUseCase` | `ToggleContactFormUseCase.ts` | `execute(tenantId, userId, enabled)` |
| `ToggleCalendarUseCase` | `ToggleCalendarUseCase.ts` | `execute(tenantId, userId, enabled)` |
| `GetPublicProfileUseCase` | `GetPublicProfileUseCase.ts` | `execute(tenantId, username)` |
| `GetPublicCalendarUseCase` | `ManageCalendarSlotsUseCase.ts` | `execute(tenantId, username)` |
| `AddCalendarSlotUseCase` | `ManageCalendarSlotsUseCase.ts` | `execute(tenantId, userId, dto)` |
| `DeleteCalendarSlotUseCase` | `ManageCalendarSlotsUseCase.ts` | `execute(tenantId, userId, slotId)` |
| `ReleaseCalendarSlotUseCase` | `ManageCalendarSlotsUseCase.ts` | `execute(tenantId, userId, slotId)` |
| `AddLinkUseCase` | `ManageLinksUseCase.ts` | `execute(tenantId, userId, dto)` |
| `UpdateLinkUseCase` | `ManageLinksUseCase.ts` | `execute(tenantId, userId, linkId, dto)` |
| `DeleteLinkUseCase` | `ManageLinksUseCase.ts` | `execute(tenantId, userId, linkId)` |
| `BookAppointmentUseCase` | `BookAppointmentUseCase.ts` | `execute(tenantId, username, dto)` |
| `GetAppointmentsUseCase` | `GetAppointmentsUseCase.ts` | `execute(tenantId, userId, page, limit)` |
| `DeleteAppointmentUseCase` | `ManageAppointmentsUseCase.ts` | `execute(tenantId, userId, id)` |
| `ConfirmAppointmentUseCase` | `ManageAppointmentsUseCase.ts` | `execute(tenantId, userId, id)` |
| `ReleaseAppointmentSlotUseCase` | `ManageAppointmentsUseCase.ts` | `execute(tenantId, userId, id)` |
| `SubmitLeadUseCase` | `SubmitLeadUseCase.ts` | `execute(tenantId, username, data)` |
| `GetLeadsUseCase` | `GetLeadsUseCase.ts` | `execute(tenantId, userId)` |
