import { connectDB } from "./config/db.js"
import prompt from "prompt-sync"
import fs from "fs"
class usuario {
    static async col(){
        const db = await connectDB();
        return db.collection("reviews")
    }
    static async list() {
        const col = await this.col();
        return await col.fin({}, {projection: {_id:0, userId:0, title:0, comment:0, rating:0, createAt:0, movieId:1 }}).toArray();
    }
    static async findbymovieid(id){
        const col = await this.col();
        return await col.findOne({id}).toArray;
    }
}

function bring(){
    console.log(usuario.list());
    const opcion = prompt("cual id de pelicula desea sacar copia de las reseñas?") 
    const data = usuario.findbymovieid(opcion);
    const datos = JSON.stringify(data)
    fs.writeFile(`./exports/${datos.title}.csv`, datos, function(err, result){
        if(err) console.log("error", err);
        else console.log(result)
    })
}

bring();