const { logConfig } = require('@vtfk/logger')
const TemplateClient = require('../lib/TemplateClient/TemplateClient')
const Sjablong = require('sjablong') // Replace placeholders in templates
const { matrikkelApi } = require('../config')
const { MatrikkelClient } = require('../lib/KartverketMatrikkelAPI/MatrikkelClient')
const { flattenObject } = require('../lib/helpers/flattenObject')

module.exports = async function (context, req) {
    logConfig({
        prefix: 'azf-matrikkel-proxy - storeService',
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


    const client = new MatrikkelClient(matrikkelApi.MATRIKKELAPI_USERNAME, matrikkelApi.MATRIKKELAPI_PASSWORD, 'matrikkelapi/wsapi/v1/StoreServiceWS')
    let store = await client.callStoreService(req, req.body.items)

    //   let item
    //   console.log(store[0]["getObjectsResponse"]["return"].item.map(item => item.eierforhold))
    //   try {
    //     item = store[0]["getObjectsResponse"]["return"].item.map(item => item)
    //   } catch {
    //     item = {}
    //     throw new Error('Fant ingen enheter innenfor polygonet')
    //   }
    // console.log(store[0]["getObjectsResponse"]["return"].item.map(item => item.eierforhold))

    store = flattenObject(store)
    try {
        return { status: 200, body: {store} }
    } catch (error) {
        return { status: 500, body: error }
    }
}
