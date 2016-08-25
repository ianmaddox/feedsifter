"use strict";
var RSS = require('rss');
var FeedParser = require('feedparser');
var request = require('request');
var fs = require('fs');

/**
 * Main handler called by AWS Lambda or the index.js wrapper script.
 */
module.exports = function(feed, rawFilters) {
	return new Promise((resolve, reject) => {
		var out = false;
		var filters = parseFilters(rawFilters)
		try {
			if(filters === false) {
				resolve(false);
				return;
			}
			request.get(feed)
				.on('error', function (error) {
					if(error)	{
						reject(error);
						return false;
					}
				})
				.pipe(new FeedParser())
				.on('error', function (error) {
					if(error)	{
						reject(error);
						return false;
					}
				})
				.on('meta', function (meta) {
					out = new RSS(JSON.parse(JSON.stringify(meta)));
				})
				.on('readable', function() {
					var stream = this;
					var item;
					while (item = stream.read()) {
						if(checkFeedItem(item, filters)) {
							let newItem = {
								title: nab(item.title),
								description: nab(item.description),
								date: nab(feed.date),
								url: nab(item.link),
								site_url: nab(item.xmlurl),
								image_url: nab(item.image),
								copyright: nab(item.copyright),
								language: nab(item.language),
								categories: nab(item.categories),
							};
							out.item(newItem);
						}
					}
				})
				.on('end', function() {
					if(out === false) {
						return false;
					}
					resolve(out.xml());
				});
		} catch(e) {
			resolve(false);
		}
	});
};

function nab(v) {
	return v === undefined || v === null ? '' : v;
}

/**
 * Interpret the filters sent in by the user
 */
function parseFilters(raw) {
	var parsed = {include:[],exclude:[]};
	if(!raw) {
		// Dont parse an empty filter set
		return false;
	}

	var lines = raw.split(/[\r\n]/);
	for(let i of Object.keys(lines)) {
		let line = lines[i].trim();
		if(line === "") {
			// Ignore blank linkes
			continue;
		}
		if(line[0] === "-") {
			parsed.exclude.push(line);
		} else {
			parsed.include.push(line);
		}
	}
	return parsed;
}

/**
 * Check an individual feed entry against the parsed filters
 */
function checkFeedItem(item, filters) {
	// Create a single, searchable string devoid of HTML
	var content = [
		item.title,
		item.description,
		item.summary,
		item.author,
		item.comments,
		item.categories,
		item["rss:description"],
		item.meta
	].join("\n").replace(/<(?:.|\n)*?>/gm, '');

	// First, filter out any entry which is excluded
	for(let e of Object.keys(filters.exclude)) {
		let rex = new RegExp(filters.exclude[e].substr(1), 'gi');
		if(rex.test(content)) {
			return false;
		}
	}

	// Next, exclude anything not matching a positive filter
	for(let i of Object.keys(filters.include)) {
		let rex = new RegExp(filters.include[i], 'gi');
		if(rex.test(content)) {
			return true;
		}
	}
	// If we've fallen all the way through, there was no match.
	return false;
}
