const https = require('https');
const ParserStream = require('parse5-parser-stream');
const RSS = require( 'rss' );

exports.handler = function(event, context, callback) {
  return new Promise((resolve, reject) => {
    https.get('https://www.instagram.com/cloudwaterbrew/', res => {
        const parser = new ParserStream();

        parser.on('script', (scriptElement, documentWrite, resume) => {
          let content = scriptElement.childNodes.find(({nodeName}) => nodeName === '#text');

          if( !content || (content && !content.value.startsWith( 'window._sharedData' )) ){
            return resume();
          }

          const value = content.value.replace('window._sharedData = ', '').slice(0, -1);

          try{
            resolve(JSON.parse(value));
            resume();
          }
          catch(e){
            reject( e )
          }

        });

        const chunks = [];

        res.on("data", (chunk) => {
          chunks.push(chunk);
        });

        res.on("error", (error)  =>{
          reject(error);
        });

        res.on("end", ()  =>{
          parser.end( Buffer.concat(chunks).toString());
        });
      });
  })
  .then( data => {
    const user = data.entry_data.ProfilePage[0].graphql.user;

    const feed = new RSS({
      title: user.full_name,
      description: user.biography,
      feed_url: process.env.URL,
      pubDate: new Date(),
    });

    user.edge_owner_to_timeline_media.edges.forEach( ({node}) => {
      feed.item({
        title: node.edge_media_to_caption.edges[0].node.text,
        description: node.display_url,
        url: `https://www.instagram.com/p/${node.shortcode}/`,
        date: new Date( node.taken_at_timestamp * 1000 ),
      });
    })

    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/xml; charset=utf-8'
      },
      body: feed.xml({indent: true})
    }
  })
  .catch(error => {
    return {
      statusCode: 500,
      body: error.message
    }
  })
}
