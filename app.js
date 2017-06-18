const express  = require('express');
const app = express();
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer();
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');

const faker = require('faker');
const config = require('./config');


const mongoose = require('mongoose');
mongoose.connect(`mongodb://${config.db.user}:${config.db.password}@ds129342.mlab.com:29342/expressmovie`);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connextion error: cannot connect to my DB'));
db.once('open', ()=>{
	console.log('connected to the DB');
});

const moviesSchema = mongoose.Schema({
	movietitle : String,
	movieyear : Number
});

const Movie = mongoose.model('Movie', moviesSchema);


const PORT = 3000;
let frenchMovies = [];
const secret = 'jemapelleramajesuisneele26avriletceciestmonsecret1992CODAzziRAmA';

app.use('/public', express.static('public'));
//app.use(bodyParser.urlencoded({extended : false}));
app.use(expressJwt({secret : secret}).unless({path:['/','/movies','/movie-search','/login',new RegExp('/movies-details.*/', 'i'), new RegExp('/movies.*/', 'i')]}));

app.set('views', './views');
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
	//res.send('Hello <b>movies</b>');
	res.render('index');
});

app.get('/movies', (req, res) => {
	//res.send('Hello <b>movies!</b>');

	frenchMovies = [];
	Movie.find((err,movies) => {
		if (err){
			console.error(err);
			res.sendStatus(500);
		} else {
			frenchMovies = movies;
			res.render('movies', {movies : frenchMovies})
		}
	})

});

var urlencodedParser = bodyParser.urlencoded({extended : false})

app.post('/movies', upload.fields([]), (req, res) => {
	if(!req.body){
		return res.sendStatus(500);
	} else {
		const formData = req.body;
		console.log(formData);
		const myMovie = new Movie({ movietitle : formData.title, movieyear: formData.year});
		myMovie.save((err, savedMovie) => {
			if(err){
				console.error(err);
				res.sendStatus(500);
			} else{
				console.log(savedMovie);
				res.sendStatus(201);
			}
		})

	}
})

/*app.post('/movies', urlencodedParser, (req, res) => {
	console.log(req.body);
	const newMovie = {title : req.body.title, year : req.body.year };
	frenchMovies = [...frenchMovies, newMovie]
	console.log(frenchMovies)
	res.sendStatus(201);
})*/

/*app.get('/movie-details', (req, res) => {
	//res.send('Hello <b>movies!</b>');
	res.render('movie-details')

});*/

app.get('/movies/add', (req, res) => {
	res.send('form');
});


app.get('/movies/:id', (req, res) => {
	const id = req.params.id;
	//res.send('film numero ' +id);
	res.render('movie-details', {movieid: id})

});

app.get('/movies-details/:id', (req, res) => {
	const id = req.params.id;
	//res.send('film numero ' +id);
	Movie.findById(id, (err,movie) => {
		if (err){
			res.sendStatus(404)
		}else{
			res.render('movie-details', {movie: movie})
		}
	})

});

app.post('/movies-details/:id', urlencodedParser, (req,res) =>{
	if(!req.body){
		console.log('no req.body')
		return res.sendStatus(500);
	} else {
		const id = req.params.id;
		console.log('movietitle : ', req.body.movietitle);
		Movie.findByIdAndUpdate(id, {$set : {movietitle : req.body.movietitle, movieyear : req.body.movieyear}},{new : true}, (err, movie) => {
			if(err){
				console.error(err);
				return res.sendStatus(500);
			} else {
				res.redirect('/movies')
			}
		})
		
	}

})

app.delete('/movies-details/:id',(req, res) =>{
	const id = req.params.id;
	Movie.findByIdAndRemove(id, (err, success) =>{
		if(err){

		} else{
			res.sendStatus(202);
		}
	})
})

app.get('/movie-search', (req, res) => {
	res.render('movie-search')

});

app.get('/login', (req,res) => {
	res.render('login', { title:'Espace Membre'});
});

const fakeUser = { email: 'test@user.fr', password: 'qsd'}

app.post('/login', urlencodedParser, (req, res) =>{
	console.log('login post', req.body);
	if(!req.body){
		res.sendStatus(500);
	} else{
		if ( fakeUser.email === req.body.email && fakeUser.password === req.body.password){
			const myToken = jwt.sign({iss: 'http://expressmovies.fr', user : 'sam', scope:'moderator'}, secret);
			res.json(myToken);
			
			
			/*res.json({
				email: 'test@user.fr',
				favoriteMovive :'Space Jam',
				favoriteMovieTheater: 'Gaumont Pathé',
				lastLoginDate: new Date()
			});*/

		} else {
			res.sendStatus(401);
		}
	}
})

app.get('/member-only', (req, res) => {
	console.log('req.user', req.user);
	res.send(req.user)
})


app.listen(PORT, () => {
	console.log( `listenning on port ${PORT}`);
});