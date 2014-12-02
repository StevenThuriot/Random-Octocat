var url = 'http://octodex.github.com';
var cache = require("memory-cache");

function cacheOctocats(callback) {
    console.log('Retrieving octocats.');
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
                images.push(img);
            });

            if (images.length > 0) {
                cache.put('images', images, 3000 * 60 * 60);
            }

            console.log('Cached %s octocats.', images.length);
            if (callback) callback(undefined, images);
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

        var image = url + images[Math.floor(Math.random() * images.length)];
        console.log('Retrieving octocat: %s.', image);

        callback(undefined, image);
    });
}

var app = require('http').createServer(function (req, res) {
    if (req.url !== '/') {
        res.writeHead(404);
        res.end();

        return;
    }

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
});

cacheOctocats(function () {
    var port = process.env.PORT || 3000;
    app.listen(port);

    console.log('Praise Octocat!');
});