function load() {
  sendRequest(`${site}/?p=${threshold}`, 'GET', null, {Accept: 'application/json'})
    .then((text) => {
      const json = JSON.parse(text);
      console.log(`json = ${JSON.stringify(json.stories[0], null, 2)}`)

      let items = []

      json.stories.forEach(story => {
        let item = Item.createWithUriDate(story.url, new Date(story.createdAt))
        item.body = `<p>${story.title}</p>`
        items.push(item)
      });

      processResults(items)
    })
    .catch((requestError) => {
      processError(requestError)
    });
}

// globals loaded by Tapestry
var site = site
var threshold = threshold
var Item = Item
var sendRequest = sendRequest
var processResults = processResults
var processError = processError
