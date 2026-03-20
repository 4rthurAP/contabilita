// Inicializa replica set do MongoDB para suporte a transactions
// Necessario para lancamentos contabeis com partida dobrada (atomicidade)
try {
  rs.status();
} catch (e) {
  rs.initiate({
    _id: 'rs0',
    members: [
      { _id: 0, host: 'mongo1:27017' },
      { _id: 1, host: 'mongo2:27018' },
      { _id: 2, host: 'mongo3:27019' },
    ],
  });
}
