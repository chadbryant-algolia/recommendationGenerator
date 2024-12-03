import { config } from 'dotenv'
import BigCommerce from 'node-bigcommerce'

// eslint-disable-next-line import/extensions
import { createCsv, getRandomDateWithinLast30Days } from './utils.js'

config({ path: `.env` })

try {
    // Algolia limits file size being updated to 100MB
    const MAX_ESTIMATED_SIZE = 90 * 1024 * 1024 // 90MB - actual file size created 94.4MB

    const args = process.argv.slice(2)
    const clientId =
        process.env.BIGCOMMERCE_CLIENT_ID ?? args[args.indexOf('--id') + 1]
    const secret =
        process.env.BIGCOMMERCE_CLIENT_SECRET ??
        args[args.indexOf('--secret') + 1]
    const accessToken =
        process.env.BIGCOMMERCE_ACCESS_TOKEN ??
        args[args.indexOf('--accessToken') + 1]
    const storeHash =
        process.env.BIGCOMMERCE_STORE_HASH ??
        args[args.indexOf('--storeHash') + 1]

    if (
        (secret === -1 &&
            clientId === -1 &&
            accessToken === -1 &&
            storeHash === -1) ||
        (typeof secret === 'undefined' &&
            typeof clientId === 'undefined' &&
            typeof accessToken === 'undefined' &&
            typeof storeHash === 'undefined')
    ) {
        throw new Error(
            `Please provide the required arguments. Example: \n\n` +
                `npm run create:trendingItemsCsv -- --id <clientId> --secret <secret> --accessToken <accessToken> --storeHash <storeHash>\n`
        )
    }
    if (clientId === -1 || typeof clientId === 'undefined') {
        throw new Error('clientId is required use --id')
    }
    if (secret === -1 || typeof secret === 'undefined') {
        throw new Error('secret is required use --secret')
    }
    if (accessToken === -1 || typeof accessToken === 'undefined') {
        throw new Error('accessToken is required use --accessToken')
    }
    if (storeHash === -1 || typeof storeHash === 'undefined') {
        throw new Error('storeHash is required use --storeHash')
    }

    let useProductMin = 10
    let useProductMax = 10000
    const minIndex = args.indexOf('--min')
    const maxIndex = args.indexOf('--max')
    if (minIndex !== -1) {
        useProductMin = parseInt(args[minIndex + 1], 10)
    }
    if (maxIndex !== -1) {
        useProductMax = parseInt(args[maxIndex + 1], 10)
    }

    const bigCommerce = new BigCommerce({
        clientId,
        secret,
        accessToken,
        responseType: 'json',
        storeHash,
        apiVersion: 'v3',
    })

    const records = []
    const response = await bigCommerce.get(`/catalog/products`)
    if (typeof response.data === 'undefined' || response.data.length === 0) {
        throw new Error('No products found')
    }

    let estimatedFileSize = 0
    for (const product of response.data) {
        const numProdRecords =
            Math.floor(Math.random() * (useProductMax - useProductMin + 1)) +
            useProductMin
        for (let i = 0; i < numProdRecords; i++) {
            const record = {
                userToken: 'trending-item',
                timestamp: getRandomDateWithinLast30Days().toISOString(),
                objectID: product.id,
                eventType: 'conversion',
                eventName: `trending-item-${product.id}`,
            }

            const recordString = `${record.userToken},${record.timestamp},${record.objectID},${record.eventType},${record.eventName}\n`
            estimatedFileSize += Buffer.byteLength(recordString, 'utf8')
            if (estimatedFileSize > MAX_ESTIMATED_SIZE) {
                break
            }

            records.push(record)
        }

        if (estimatedFileSize > MAX_ESTIMATED_SIZE) {
            break
        }
    }

    createCsv(
        [
            { id: 'userToken', title: 'userToken' },
            { id: 'timestamp', title: 'timestamp' },
            { id: 'objectID', title: 'objectID' },
            { id: 'eventType', title: 'eventType' },
            { id: 'eventName', title: 'eventName' },
        ],
        records,
        'trendingItemsFromBc.csv'
    )
} catch (error) {
    // eslint-disable-next-line no-console
    console.log(error.message)
}