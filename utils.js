import { createObjectCsvWriter } from 'csv-writer'

export const createCsv = (headers, data, filename) => {
    if (
        headers.length === 0 ||
        data.length === 0 ||
        !filename ||
        filename === ''
    ) {
        throw new Error('Invalid input')
    }

    const csvWriter = createObjectCsvWriter({
        path: filename,
        header: headers,
    })

    csvWriter.writeRecords(data)
}

export const getRandomDateWithinLast30Days = () => {
    const today = new Date() // Get today's date
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago

    const randomTimestamp =
        thirtyDaysAgo.getTime() +
        Math.random() * (today.getTime() - thirtyDaysAgo.getTime())

    return new Date(randomTimestamp)
}