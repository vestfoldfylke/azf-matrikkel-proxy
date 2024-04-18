const { logConfig } = require('@vtfk/logger')
const TemplateClient = require('../lib/TemplateClient/TemplateClient')
const Sjablong = require('sjablong') // Replace placeholders in templates
const { matrikkelApi } = require('../config')
const { MatrikkelClient } = require('../lib/KartverketMatrikkelAPI/MatrikkelClient')

module.exports = async function (context, req) {
  logConfig({
    prefix: 'azf-matrikkel-proxy - matrikkelenheter',
    teams: {
      onlyInProd: false
    },
    azure: {
      context,
      excludeInvocationId: true
    }
  })

  let matrikkelContext = TemplateClient.getTemplate('matrikkelContext.xml')
  if (!req.body.matrikkelContext) {
    req.body.matrikkelContext = {}
  }
  if (req.body.koordinatsystemKodeId !== undefined) {
    req.body.matrikkelContext.koordinatsystemKodeId = req.body.koordinatsystemKodeId
  }
  matrikkelContext = Sjablong.replacePlaceholders(matrikkelContext, req.body.matrikkelContext)
  req.matrikkelContext = matrikkelContext

  // Oppretter en ny klient for å kontakte matrikkelen.
  const client = new MatrikkelClient(matrikkelApi.MATRIKKELAPI_USERNAME, matrikkelApi.MATRIKKELAPI_PASSWORD, 'matrikkelapi/wsapi/v1/MatrikkelenhetServiceWS')

  const result = await client.getMatrikkelPolygon(req, req.body.polygon)
  
  const units = result[0].findMatrikkelenheterResponse.return.item.map(unit => unit.value)
  
  if(units.length < 0) throw new Error('Fant ingen enheter innenfor polygonet')

  try {
    return { status: 200, body: { units, koordinatsystemKodeId: req.body.koordinatsystemKodeId } }
  } catch (error) {
    return { status: 500, body: error }
  }
}
