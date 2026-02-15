# Domain Layer Instructions

This layer defines the core business models and contracts. It has **zero dependencies** on infrastructure, frameworks, or external libraries.

## Folder Structure

```
src/domain/
  entities/       # Business models (plain interfaces)
  interfaces/     # Repository & service contracts
  dtos/           # Data transfer objects (request/response shapes)
```

## Creating a New Entity

Add a file in `entities/`. Entities are plain TypeScript interfaces.

```ts
// src/domain/entities/Product.ts
export interface Product {
  id: string;
  userId: string;
  name: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}
```

Rules:
- `id` is always `string` (Firestore document ID)
- Include `createdAt` and `updatedAt` timestamps when the entity is stored
- Keep entities flat; avoid nesting other entities

## Creating a New Repository Interface

Add a file in `interfaces/`. Every method **must receive `tenantId: string` as the first parameter** because all Firestore data is scoped under `tenants/${tenantId}/`.

```ts
// src/domain/interfaces/IProductRepository.ts
import { Product } from "../entities/Product";

export interface IProductRepository {
  create(tenantId: string, product: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product>;
  findById(tenantId: string, id: string): Promise<Product | null>;
  findByUserId(tenantId: string, userId: string): Promise<Product[]>;
  updateById(tenantId: string, id: string, data: Partial<Pick<Product, "name" | "price">>): Promise<Product | null>;
  deleteById(tenantId: string, id: string): Promise<boolean>;
}
```

Rules:
- `tenantId: string` is **always** the first parameter — no exceptions
- Use `Omit<Entity, "id" | "createdAt">` for create signatures
- Return `Promise<Entity | null>` for single-item lookups
- Return `Promise<Entity[]>` for lists

## Creating New DTOs

Add interfaces to `dtos/AuthDtos.ts` (or create a new DTO file if the domain grows).

```ts
// Request DTO (what the client sends)
export interface CreateProductDto {
  name: string;
  price: number;
}

// Response DTO (what the API returns)
export interface ProductResponseDto {
  id: string;
  name: string;
  price: number;
  createdAt: string; // ISO string, not Date
}
```

Rules:
- Dates in response DTOs are `string` (ISO format), not `Date`
- Request DTOs never include `id`, `createdAt`, or `tenantId`
- Response DTOs never include `tenantId` or `userId`

## Existing Interfaces Reference

| Interface | File | Methods |
|-----------|------|---------|
| `IUserRepository` | `interfaces/IUserRepository.ts` | create, createWithId, findByEmail, findById, findByUsername, updateProfile, updateUsername, addLink, updateLink, deleteLink, addCalendarSlot, updateCalendarSlotBooked, deleteCalendarSlot, updateTheme, updatePlan, updateContactFormEnabled, updateCalendarEnabled |
| `IAppointmentRepository` | `interfaces/IAppointmentRepository.ts` | create, findById, findByUserId, findBySlotId, deleteById, updateStatus |
| `ILeadRepository` | `interfaces/ILeadRepository.ts` | create, findByUserId |
| `IFileStorageService` | `interfaces/IFileStorageService.ts` | saveFile, deleteFile |
