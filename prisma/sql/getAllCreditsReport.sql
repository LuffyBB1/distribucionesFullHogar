SELECT
    client.id_cliente,
    client.nombre,
    SUM(c.monto_total) - COALESCE(
    (SELECT SUM(p.monto_pago)
     FROM "Credito" as "c"
              INNER JOIN "Pago" as "p" ON p.id_credito = c.id_credito
     WHERE c.id_cliente = client.id_cliente),0) AS "saldo_total"
FROM "Cliente" AS "client"
         INNER JOIN "Credito" AS "c" ON client.id_cliente = c.id_cliente
group by client.id_cliente;