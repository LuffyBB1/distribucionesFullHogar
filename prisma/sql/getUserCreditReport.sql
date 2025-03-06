SELECT
    c.id_credito,
    c.monto_total,
    COALESCE(SUM(p.monto_pago), 0) AS "total_pagos"
FROM "Credito" AS "c"
LEFT JOIN "Pago" AS "p" ON c.id_credito = p.id_credito
WHERE c.id_cliente = $1
GROUP BY c.id_credito;