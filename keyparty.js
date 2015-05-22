var server = require("isotope-dev").create(8080);
var fs = require("fs");

keys = {};

server.get("", function(res){
	res.writeHead(200, {"Content-Type":"text/plain"});
	res.end("hello world");
});

server.get("signup", function(res){
	file = fs.createReadStream("signup.html");
	res.writeHead(200, {"Content-Type":"text/html"});
	file.on('data', function(chunk){
		res.write(chunk);
	});

	file.on('end', function(){
		res.end();
	});
});

server.post("init/_var", function(res, req, name) {
	console.log("creating user with name: ["+name+"]");
	server.extract_data(req, function(data) {
		console.log(data);
		keys[name+".asc"] = data.pgpkey;
	});
	res.writeHead(200, {"Content-Type":"text/plain"});
	res.end("thanks!");
});

server.get("list", function(res) {
	res.writeHead(200, {"Content-Type": "text/html"});
	res.write("<html><body>")
	for(var key in keys) {
		if (keys.hasOwnProperty(key)) {
			res.write("<a href='key/"+key+"'>"+key+"</a><br />");
		}
	}
	res.end("</body></html>");
});

server.get("key/_var", function(res, req, name){
	if (keys.hasOwnProperty(name)) {
		res.writeHead(200, {"Content-Type": "application/pgp-signature"});
		console.log(keys);
		console.log(name);
		console.log(keys[name]);
		res.end(keys[name]);
	} else {
		server.notFound();
	}
});