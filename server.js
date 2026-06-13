const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');

// Se utiliza para permitir las solicitudes
const middlewares = jsonServer.defaults();
server.use(middlewares);

// Por temas de seguridad, se deben permitir todas las solicitudes, para que no tengamos problemas
server.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); 
    next();
});

server.use(router);

//Iniciamos el servidor en el puerto 3000 (json-server) y 3001 (react indicado en el .env)
server.listen(3000, () => {
    console.log('Servidor backend simulado corriendo en http://localhost:3000/html/login.html');
});