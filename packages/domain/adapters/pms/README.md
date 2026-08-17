# adapters/pms — vacío a propósito

Aquí vive el adaptador real del PMS el día que exista (Cloudbeds, Mews,
Opera Cloud u otro — todavía no se sabe cuál).

Debe implementar exactamente los mismos contratos que `adapters/mock`:

- `InventoryPort` — `buscarDisponibilidad`, `obtenerTarifa`
- `FolioPort` — `abrir`, `agregarCargo`, `cerrar`
- `GuestPort` — `buscarPorHabitacionYApellido`

Reglas que no cambian con el proveedor:

1. Las pantallas no se tocan. Si sustituir el mock por esto obliga a
   editar una pantalla, el adaptador está mal hecho.
2. Las credenciales viven en Secret Manager y solo las leen las Cloud
   Functions. La app nunca habla con el PMS directo.
3. La disponibilidad deja de ser instantánea: este adaptador debe
   exponer estados de carga y error reales, no optimistas.

Estimación al día de hoy: dos a cuatro semanas una vez que existan
credenciales y documentación de API del proveedor.
