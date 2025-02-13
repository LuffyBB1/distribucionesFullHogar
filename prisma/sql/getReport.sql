SELECT
    COALESCE((SELECT SUM(c.monto_total) FROM "Credito" AS c WHERE c.fecha_inicio BETWEEN DATE($1) AND DATE($2)),0) AS total_creditos ,
    COALESCE((SELECT SUM(p.monto_pago) FROM "Pago" AS p WHERE p.fecha_pago BETWEEN DATE($1) AND DATE($2)),0) AS total_pagos;