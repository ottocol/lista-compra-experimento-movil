-- Añade a tu lista los 18 productos que tienen foto, para la demo de imágenes.
-- Ejecutar en el SQL Editor de Supabase cambiando el email por el tuyo.
insert into public.lista (nombre, comprado, usuario)
select nombre, false, u.id
from auth.users u,
     unnest(array['Leche', 'Pan', 'Huevos', 'Lentejas', 'Arroz', 'Tomates', 'Plátanos', 'Manzanas', 'Café',
                  'Aceite', 'Yogur', 'Queso', 'Pasta', 'Agua', 'Galletas', 'Zanahorias', 'Cebollas', 'Patatas']) as nombre
where u.email = 'tu-email@ua.es';
