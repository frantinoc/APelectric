
const search= document.getElementById('searchInput');
const eastingEln = document.getElementById('easting');
const northingEln = document.getElementById('northing');

function buscar(){
fetch('Datos.json')
.then(response => response.json())
.then(json => {
    
    const modelobuscado = String(search.value || '').trim();
    const result=json.find(item=>item.NumeroMatricula.toLowerCase()===modelobuscado.toLowerCase());
    console.log(result.PositionX.toLowerCase());
    console.log(result.PositionY.toLowerCase());
    eastingEln.value = result.PositionX.toLowerCase();
    northingEln.value = result.PositionY.toLowerCase();
validarYConvertir();
    return result;
})
.catch(error=> console.error("Error",error));
}


