global.XMLHttpRequest = require('xhr2');
const serial = 'ENSITUSONE';
const passwd = '5996550a5f9e650b911146c76e3bf794';
const io = require('socket.io-client');
const Gpio = require('onoff').Gpio;
var sleep = require('sleep');
var timer = 2000;
var alarma = 12000;
var pin1 = new Gpio(5, 'out');
var pin2 = new Gpio(6, 'out');
var pin3 = new Gpio(13, 'out');
var pin4 = new Gpio(19, 'out');
const int = new Gpio(17, "in", "both");
var sender = true;

loginEquipo(serial, passwd);

async function alarm(callback){
    int.watch((err, v) => {
        if(v==0){
            if(sender){
                console.log(new Date(), "Enviando correo de advertencia!");
                sender = false;
                callback.emit("ENSITUS-ALERT",{
                    "mensaje": "ENSITUS ONE ha sido abierto!!",
                    "date": new Date(),
                });
                setTimeout(function(){
                    sender = true;
                }, alarma);
            }
        }
    });
}


function loginEquipo(serial, passwd) {
    var datosEquipo = null;
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
            var res = JSON.parse(xhr.response); //La respuesta se codifica en fomato JSON
            if (res.error == false) {
                datosEquipo = res.equipo;
                const socket = io.connect('https://www.ensitus.com:5001', {
                    transports: ["websocket"],
                    forceNew: true,
                    reconnect: true,
                    extraHeaders: {'x-token': res.token}
                });

                socket.on('connect', function () {
                    console.log(new Date(), 'conectado');
                    alarm(socket);
                });

                socket.on('ENSITUS-LUCY-', (data) => {
                    console.log(data)
                    var accion = data.accion;
                    var door = data.puerto;
                    if (accion == 'open') {
                        if(door == '1'){
                            pin1.writeSync(1);
                            setTimeout(function(){
                                pin1.writeSync(0);
                                console.log(new Date() ,"Cerrando puerta: 1");
                            }, timer);
                        }else if(door == '2'){
                            pin2.writeSync(1);
                            setTimeout(function(){
                                pin2.writeSync(0);
                                console.log(new Date(), "Cerrando puerta: 2");
                            }, timer);
                        }else if(door == '3'){
                            pin3.writeSync(1);
                            setTimeout(function(){
                                pin3.writeSync(0);
                                console.log(new Date(), "Cerrando puerta: 3");
                            }, timer);
                        }else if(door == '4'){
                            pin4.writeSync(1);
                            setTimeout(function(){
                                pin4.writeSync(0);
                                console.log(new Date(), "Cerrando puerta: 4");
                            }, timer);
                        }
                    } else if (accion == 'close') {
                        pin.writeSync(0);
                    }
                });
                socket.on('ENSITUS-TECH-', (data) => {
                    //console.log(data)
                    var accion = data.accion;
                    if (accion == 'RESTART') {
                        //OPEN
                    } else if (accion == 'OTHER') {
                        //CLOSE
                    }
                });
                socket.on("disconnect", () => {
                    console.log("DESCONECTADO: " + socket.connected);
                });
            } else
                console.log(res.error)
        } else
            console.log('Ooops. ha ocurrido un error!');
    };
    xhr.open('POST', 'https://www.ensitus.com:5001/api/login/');
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send("type=equipo&email=" + serial + "&password=" + passwd);
}

