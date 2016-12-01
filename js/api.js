var funcionariosUrl = "https://modernizacionmunicba.github.io/dendrograma-funcionarios-provincia-de-buenos-aires/dendrograma/funcionarios.json";

var funcionariosTask = new Promise(function (resolve, reject) {
    d3.json(funcionariosUrl, function (error, funcionarios) {
        if (error) reject(error);
        resolve(funcionarios);
    });
});


/* cache del navegador 
var funcionariosTask = new Promise(function (resolve, reject) {
    if (localStorage.funcionariosDataPBA == null || localStorage.funcionariosDataPBA == "null" || localStorage.funcionariosDataPBA == "undefined") {
        d3.json(funcionariosUrl, function (error, funcionarios) {
            if (error) reject(error);
            resolve(funcionarios);
            localStorage.funcionariosDataPBA = JSON.stringify(funcionarios);
        });
    } else {
        resolve(JSON.parse(localStorage.funcionariosData));
    }
});
*/

function getApiUrl() {
    return funcionariosUrl;
}