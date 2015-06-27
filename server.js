var cache = require("memory-cache");

function cacheOctocats(callback) {
    console.log('Retrieving octocats.');
    var url = 'https://octodex.github.com';

    var request = require('request')(url,
        function (error, res, html) {
            if (error) {
                console.log(error);
                callback(error, undefined);
                return;
            }

            var $ = require('cheerio').load(html);
            var imgs = $('a.preview-image > img');

            images = [];

            imgs.each(function (i, element) {
                var img = $(element).attr('data-src');
                images.push(url + img);
            });

            if (images.length > 0) {
                cache.put('images', images, 12000 * 60 * 60);
            }

            console.log('Cached %s octocats.', images.length);
            callback(undefined, images);
        });
};

function getOctocats(callback) {
    var images = cache.get('images');

    if (images) {
        callback(undefined, images);
    } else {
        cacheOctocats(callback);
    }
};

function getOctocat(callback) {
    getOctocats(function (error, images) {
        if (error || !images) {
            callback(error, undefined);
            return;
        }

        var image = images[Math.floor(Math.random() * images.length)];
        console.log('Retrieving octocat: %s.', image);

        callback(undefined, image);
    });
}

var app = require('http').createServer(function (req, res) {
    if (req.url === '/') {
        res.writeHead(200, {
            'Content-Type': 'text/html'
        });
        res.end('<html><head><title>Praise Octocat!</title></head><body><img src="/octocat" style="position:absolute;top:0;left:0;right:0;bottom:0;margin:auto;"></body></html>');
    } else {
        if (req.url.split('?')[0] === '/octocat') {

            getOctocat(function (error, image) {
                if (error || !image) {
                    //Shit hit the fan... Return default one.
                    res.writeHead(302, {
                        'Location': 'https://octodex.github.com/images/original.png'
                    });
                } else {
                    res.writeHead(302, {
                        'Location': image
                    });
                }
                res.end();
            });

        } else {
            res.writeHead(404);
            res.end();
        }
    }
});

cacheOctocats(function () {
    var port = process.env.PORT || 3000;
    app.listen(port);

    console.log('Praise Octocat!');
});