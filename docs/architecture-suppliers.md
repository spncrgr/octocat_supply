# Suppliers Module Data Flow

```mermaid
flowchart LR
    A[Client Request] --> B[API Route\napi/src/routes/supplier.ts]
    B --> C[Controller / Request Handler]
    C --> D[SuppliersRepository\napi/src/repositories/suppliersRepo.ts]
    D --> E[SQLite Query Builder\nbuildInsertSQL / buildUpdateSQL / SQL helpers]
    E --> F[(SQLite Database\nsuppliers table)]
    F --> G[Result Set / Row Data]
    G --> D
    D --> H[Mapped Supplier Model\nSupplier interface]
    H --> I[JSON Response]
    I --> J[Client]

    subgraph "Supplier CRUD operations"
        K[findAll]
        L[findById]
        M[create]
        N[update]
        O[delete]
        P[exists]
        Q[findByName]
    end

    D --> K
    D --> L
    D --> M
    D --> N
    D --> O
    D --> P
    D --> Q

    K --> E
    L --> E
    M --> E
    N --> E
    O --> E
    P --> E
    Q --> E
```

## Flow description

1. A client sends an HTTP request to the supplier API route.
2. The route handler validates the request and delegates to the repository layer.
3. The `SuppliersRepository` performs the appropriate database operation using SQLite helpers.
4. SQL is executed against the `suppliers` table in SQLite.
5. Returned rows are mapped back into supplier model objects.
6. The transformed result is sent back as JSON to the client.

## Source files

- Route: `api/src/routes/supplier.ts`
- Repository: `api/src/repositories/suppliersRepo.ts`
- Model: `api/src/models/supplier.ts`
- Database layer: `api/src/db/sqlite.ts`
- SQL utilities: `api/src/utils/sql.ts`
