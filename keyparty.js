var server = require("isotope-dev").create(8080);
var fs = require("fs");
var crypto = require('crypto');
var exec = require('child_process').exec;

keys = {};

server.get("", function(res){
    res.writeHead(200, {"Content-Type":"text/html"});
    res.end("<html><body><a href='/signup'>signup here</a><br /><a href='/list'>keys</a></body></html>");
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

server.get("subsign/_var", function(res, req, fp) {
    file = fs.createReadStream("subkey.html");
    res.writeHead(200, {"Content-Type":"text/html"});
    file.on('data', function(chunk){
        res.write(chunk);
    });
    file.on('end', function(){
        res.end();
    });
});

server.post("subsign/_var", function(res, req, fp) {
    server.extract_data(req, function(data) {
        if (keys[fp]) {
            (keys[fp].signitures)[data.name] = data.pgpkey;
        }
    });
    res.writeHead(200, {"Content-Type":"text/plain"});
    res.end("thanks!");
});

makekeydata = function(pgpdata, name) {
    return {
        pgpkey: pgpdata,
        pgpname: name,
        signitures: {}
    };
}

fingerprint = function(name) {
    return "gpg --with-fingerprint /tmp/"+name+" | grep 'Key fingerprint' | cut -c 25-";
}

server.post("init/_var", function(res, req, name) {
    console.log("creating user with name: ["+name+"]");
    server.extract_data(req, function(data) {
        fs.writeFile("/tmp/"+name+".asc", data.pgpkey, function(err) {
            if (err) {
                res.writeHead(500, {"Content-Type":"text/plain"});
                res.end(err);
            } else {
                exec(fingerprint(name+".asc"), function(error, out, err) {
                    if (error) {
                        res.writeHead(500, {"Content-Type":"text/plain"});
                        res.end(error+"");
                    } else {
                        keys[out.replace(/\s/g, '')] = makekeydata(data.pgpkey, name+".asc");
                        res.writeHead(200, {"Content-Type":"text/plain"});
                        res.end("thanks!");
                    }
                });
            }
        });
    });
});

server.get("list", function(res) {
    res.writeHead(200, {"Content-Type": "text/html"});
    res.write("<html><head><style>#box{width:500px;max-width:500px;display:inline-block;}</style></head><body>");
    for(var keysha in keys) {
        if (keys.hasOwnProperty(keysha)) {
            var key = keys[keysha];
            res.write("<div id='box' style='border:4px solid #000;'>");
            res.write("<a href='key/"+keysha+"/"+key.pgpname+"'>"+key.pgpname+"</a><br />"+keysha+"<br />");
            res.write("<a href='/subsign/"+keysha+"'>Submit signed keys</a>");
            res.write("<hr />");
            res.write("Signitures: <br />");
            for(var signedby in key.signitures) {
                if (key.signitures.hasOwnProperty(signedby)) {
                    res.write(signedby+" :: <a href='/skey/"+keysha+"/"+signedby+"/sigof_"+signedby+".asc'>download</a>");
                    res.write("<br />");
                }
            }
            res.write("</div>");
        }
    }
    res.end("</body></html>");
});

server.get("key/_var/_var", function(res, req, sha, name){
    if (keys.hasOwnProperty(sha)) {
        res.writeHead(200, {"Content-Type": "application/pgp-signature"});
        res.end(keys[sha].pgpkey);
    } else {
        server.notFound();
    }
});

server.get("skey/_var/_var/_var", function(res, req, sha, sby) {
    if (keys.hasOwnProperty(sha)) {
        if (keys[sha].signitures.hasOwnProperty(sby)) {
            res.writeHead(200, {"Content-Type": "application/pgp-signiture"});
            res.end((keys[sha].signitures)[sby]);
        } else {
            server.notFound();
        }
    } else {
        server.notFound();
    }
});
