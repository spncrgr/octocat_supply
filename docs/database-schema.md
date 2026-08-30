# Database Schema

This schema is derived from the SQLite migrations in `api/database/migrations/`.

```mermaid
erDiagram
    HEADQUARTERS ||--o{ BRANCHES : owns
    SUPPLIERS ||--o{ PRODUCTS : supplies
    SUPPLIERS ||--o{ DELIVERIES : ships
    BRANCHES ||--o{ ORDERS : places
    ORDERS ||--o{ ORDER_DETAILS : contains
    PRODUCTS ||--o{ ORDER_DETAILS : listed_in
    ORDER_DETAILS ||--o{ ORDER_DETAIL_DELIVERIES : allocated_to
    DELIVERIES ||--o{ ORDER_DETAIL_DELIVERIES : fulfills

    HEADQUARTERS {
        INTEGER headquarters_id PK
        TEXT name
        TEXT description
        TEXT address
        TEXT contact_person
        TEXT email
        TEXT phone
    }

    BRANCHES {
        INTEGER branch_id PK
        INTEGER headquarters_id FK "NOT NULL"
        TEXT name
        TEXT description
        TEXT address
        TEXT contact_person
        TEXT email
        TEXT phone
    }

    SUPPLIERS {
        INTEGER supplier_id PK
        TEXT name
        TEXT description
        TEXT contact_person
        TEXT email
        TEXT phone
        INTEGER active "NOT NULL DEFAULT 1"
        INTEGER verified "NOT NULL DEFAULT 0"
    }

    PRODUCTS {
        INTEGER product_id PK
        INTEGER supplier_id FK "NOT NULL"
        TEXT name
        TEXT description
        REAL price "NOT NULL"
        TEXT sku "NOT NULL"
        TEXT unit "NOT NULL"
        TEXT img_name
        REAL discount "DEFAULT 0.0"
    }

    ORDERS {
        INTEGER order_id PK
        INTEGER branch_id FK "NOT NULL"
        TEXT order_date "NOT NULL"
        TEXT name
        TEXT description
        TEXT status "NOT NULL DEFAULT 'pending'"
    }

    ORDER_DETAILS {
        INTEGER order_detail_id PK
        INTEGER order_id FK "NOT NULL"
        INTEGER product_id FK "NOT NULL"
        INTEGER quantity "NOT NULL"
        REAL unit_price "NOT NULL"
        TEXT notes
    }

    DELIVERIES {
        INTEGER delivery_id PK
        INTEGER supplier_id FK "NOT NULL"
        TEXT delivery_date "NOT NULL"
        TEXT name
        TEXT description
        TEXT status "NOT NULL DEFAULT 'pending'"
    }

    ORDER_DETAIL_DELIVERIES {
        INTEGER order_detail_delivery_id PK
        INTEGER order_detail_id FK "NOT NULL"
        INTEGER delivery_id FK "NOT NULL"
        INTEGER quantity "NOT NULL"
        TEXT notes
    }
```

## Relationship details

- `headquarters` to `branches`: one-to-many
  - Each branch belongs to exactly one headquarters.
  - One headquarters can manage many branches.

- `suppliers` to `products`: one-to-many
  - Each product is supplied by one supplier.
  - One supplier can provide many products.

- `suppliers` to `deliveries`: one-to-many
  - Each delivery is associated with one supplier.
  - One supplier can have many deliveries.

- `branches` to `orders`: one-to-many
  - Each order is placed by one branch.
  - One branch can place many orders.

- `orders` to `order_details`: one-to-many
  - Each order detail belongs to one order.
  - One order can contain many order detail entries.

- `products` to `order_details`: one-to-many
  - Each order detail references one product.
  - One product may appear in many order details across different orders.

- `order_details` to `deliveries` via `order_detail_deliveries`: many-to-many through join table
  - Each order detail can be linked to multiple deliveries.
  - Each delivery can fulfill multiple order detail entries.
  - `order_detail_deliveries` stores the `quantity` and optional `notes` for each link.

## Referential integrity

All foreign keys use SQLite foreign key constraints and are configured with cascade behavior on delete for the parent-child relationships:

- `branches.headquarters_id` -> `headquarters.headquarters_id` on delete cascade
- `products.supplier_id` -> `suppliers.supplier_id` on delete cascade
- `orders.branch_id` -> `branches.branch_id` on delete cascade
- `order_details.order_id` -> `orders.order_id` on delete cascade
- `order_details.product_id` -> `products.product_id` on delete cascade
- `deliveries.supplier_id` -> `suppliers.supplier_id` on delete cascade
- `order_detail_deliveries.order_detail_id` -> `order_details.order_detail_id` on delete cascade
- `order_detail_deliveries.delivery_id` -> `deliveries.delivery_id` on delete cascade
