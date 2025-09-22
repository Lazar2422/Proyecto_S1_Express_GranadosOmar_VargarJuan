import express from "express";
import fs from "fs";
import cors from "cors";

const app = express();
const PORT = 3000

app.use(cors());

app.get("/movies", (req, res)=>{
    const movies = JSON.parse(fs.readFileSync("peliculas.json","utf-8"));
    res.json(movies);
});

app.get("/movies/:id", (req,res)=> {
    const movies = JSON.parse(fs.readFyleSync("peliculas.json", "utf-8"));
    const movie = movies.find(m => m.id === parseInt(req.params.id));
    if (movie){
        req.json(movie);
    }
    else {
        res.status(404).json({
            message:"Película no encontrada"
        });
    }
});

app.get("/genres", (req,res)=> {
    const { name } = req.query;
    const movies = JSON.parse(fs.readFileSync("peliculas.json", "utf-8"));
    
    if (!name){
        const allGenres = [...new Set(movies.flatMap(m => m.genres))];
        return res.json(allGenres);
    } 

    const filteredMovies = movies.filter(m => m.genres.includes(name));

  res.json(filteredMovies);
})

app.listen(PORT, ()=>{
    console.log(`servidor corriendo en ${PORT}`)
})