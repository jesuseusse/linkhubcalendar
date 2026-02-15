# Infrastructure Layer Instructions

This layer provides concrete implementations of domain interfaces using Firebase (Firestore + Storage).

## Folder Structure

```
src/infrastructure/
  container.ts         # Dependency injection (wires repos → use cases)
  repositories/        # Firestore repository implementations
  services/            # External service implementations (Storage, etc.)
```

## Creating a New Firestore Repository

### 1. Create the repository class

```ts
// src/infrastructure/repositories/FirestoreProductRepository.ts
import { adminDb } from '@/lib/firebase/admin';
import { IProductRepository } from '@/domain/interfaces/IProductRepository';
import { Product } from '@/domain/entities/Product';

const COLLECTION = 'products';

function docToProduct(id: string, data: FirebaseFirestore.DocumentData): Product {
  return {
    id,
    userId: data.userId,
    name: data.name,
    price: data.price,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  };
}

export class FirestoreProductRepository implements IProductRepository {
  // Tenant-scoped collection: tenants/{tenantId}/products
  private col(tenantId: string) {
    return adminDb.collection(`tenants/${tenantId}/${COLLECTION}`);
  }

  async create(tenantId: string, product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const now = new Date();
    const ref = this.col(tenantId).doc();
    const data = { ...product, createdAt: now, updatedAt: now };
    await ref.set(data);
    return { ...data, id: ref.id };
  }

  async findById(tenantId: string, id: string): Promise<Product | null> {
    const doc = await this.col(tenantId).doc(id).get();
    if (!doc.exists) return null;
    return docToProduct(doc.id, doc.data()!);
  }

  async findByUserId(tenantId: string, userId: string): Promise<Product[]> {
    const snap = await this.col(tenantId)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map((doc) => docToProduct(doc.id, doc.data()));
  }

  async updateById(tenantId: string, id: string, data: Partial<Pick<Product, 'name' | 'price'>>): Promise<Product | null> {
    const ref = this.col(tenantId).doc(id);
    await ref.update({ ...data, updatedAt: new Date() });
    const doc = await ref.get();
    if (!doc.exists) return null;
    return docToProduct(doc.id, doc.data()!);
  }

  async deleteById(tenantId: string, id: string): Promise<boolean> {
    await this.col(tenantId).doc(id).delete();
    return true;
  }
}
```

### 2. Register in the container

```ts
// src/infrastructure/container.ts

// 1. Import the repository
import { FirestoreProductRepository } from './repositories/FirestoreProductRepository';

// 2. Import the use case(s)
import { CreateProductUseCase, DeleteProductUseCase } from '@/application/use-cases/ManageProductsUseCase';

// 3. Instantiate the repository
const productRepo = new FirestoreProductRepository();

// 4. Wire into the container
export const container = {
  // ... existing entries
  createProductUseCase: new CreateProductUseCase(productRepo),
  deleteProductUseCase: new DeleteProductUseCase(productRepo),
};
```

## Rules

1. **All Firestore collections are tenant-scoped**: `tenants/${tenantId}/{collection}`
2. Use a private `col(tenantId)` helper method to build the collection path
3. Use a `docToEntity()` function to convert Firestore documents to domain entities
4. Handle Firestore timestamps with `data.field?.toDate?.() ?? new Date()`
5. `tenantId` is the first parameter of every public method (matches the interface)
6. Repository classes `implements` the corresponding domain interface

## Firestore Collection Paths

| Collection | Path | Repository |
|------------|------|------------|
| Users | `tenants/{tenantId}/users` | `FirestoreUserRepository` |
| Appointments | `tenants/{tenantId}/appointments` | `FirestoreAppointmentRepository` |
| Leads | `tenants/{tenantId}/leads` | `FirestoreLeadRepository` |
| Tenant Registry | `tenant_registry` (root, not tenant-scoped) | Used by `resolveTenantId` |

## Container Reference

The container (`container.ts`) acts as a simple dependency injection root:
- Repositories are instantiated once at module level
- Use cases receive repository instances via constructor
- API routes access use cases via `container.{useCaseName}`
- The `userRepo` is also exported directly for the signup route
