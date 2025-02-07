async function load() {
  let body

  try {
    body = await sendRequest(
      `${site}/api/v1/search?tags=front_page&hitsPerPage=30`, // only 30 stories on front page
      'GET',
      null,
      {Accept: 'application/json'}
    )
  } catch (error) {
    processError(error)
  }

  const json = JSON.parse(body)
  const stories = json.hits

  const oldIds = (getItem('ids') || '').split(',')

  const newIds = []
  const items = []

  try {
    for (const story of stories) {
      if (!story.story_id) continue
      if (oldIds.indexOf(story.story_id.toString()) !== -1) continue

      newIds.push(story.story_id)

      const hnUrl = `https://news.ycombinator.com/item?id=${story.story_id}`
      const url = story.url || hnUrl
      const host = url.split('/')[2] // URL primitive is not available

      const annotation = Annotation.createWithText(host)
      annotation.uri = url

      const icon = await lookupIcon(url) // this can be slow
      if (icon) annotation.icon = icon

      const item = Item.createWithUriDate(url, new Date(story.created_at))
      item.annotations = [annotation]
      item.attachments = [LinkAttachment.createWithUrl(url)] // ensure main link is story url
      item.title = story.title
      item.body = /*html*/`
        <p>
          <a href="${hnUrl}">
            ${story.points || 0}&thinsp;↑
            &#12539;
            ${story.num_comments || 0}&thinsp;↩
          </a>
        </p>
        ${story.story_text ? `<p>${story.story_text}</p>` : ''}
      `.trim()

      items.push(item)
    }
  } catch (error) {
    processError(error)
  }

  // combine old and new ids; save recent 30 ids
  // could probably save more, but 30 covers the front page
  let ids = oldIds.concat(newIds)
  ids = ids.slice(-30)

  setItem('ids', ids.join(','))
  processResults(items)
}

// globals loaded by Tapestry
// makes my editor happy
var site = site
var threshold = threshold
var Item = Item
var Annotation = Annotation
var LinkAttachment = LinkAttachment
var sendRequest = sendRequest
var lookupIcon = lookupIcon
var processResults = processResults
var processError = processError
var getItem = getItem
var setItem = setItem

/*
{
  "_highlightResult": {
    "author": {
      "matchLevel": "none",
      "matchedWords": [],
      "value": "Hold-And-Modify"
    },
    "story_text": {
      "matchLevel": "none",
      "matchedWords": [],
      "value": "Hello.<p>Cloudflare's Browser Intergrity Check/Verification/Challenge feature..."
    },
    "title": {
      "matchLevel": "none",
      "matchedWords": [],
      "value": "Tell HN: Cloudflare is blocking Pale Moon and other non-mainstream browsers"
    }
  },
  "_tags": [
    "story",
    "author_Hold-And-Modify",
    "story_42953508",
    "ask_hn",
    "front_page"
  ],
  "author": "Hold-And-Modify",
  "children": [...],
  "created_at": "2025-02-05T19:08:12Z",
  "created_at_i": 1738782492,
  "num_comments": 431,
  "objectID": "42953508",
  "points": 1215,
  "story_id": 42953508,
  "story_text": "Hello.<p>Cloudflare&#x27;s Browser Intergrity Check&#x2F;Verification&#x2F;Challenge feature...",
  "title": "Tell HN: Cloudflare is blocking Pale Moon and other non-mainstream browsers",
  "updated_at": "2025-02-06T20:59:45Z"
}
*/
