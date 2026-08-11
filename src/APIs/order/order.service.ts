import responseMessage from '../../constant/responseMessage'
import { CustomError } from '../../utils/errors'
import orderRepository from './_shared/repo/order.repository'
import couponRepository from '../coupon/_shared/repo/coupon.repository'
import validate from './validation/validations'
import { calculateOrderTotal } from './order.utils'
import { ICreateOrderBody } from './order.interface'
import { generateCSV, generateExcel, generatePDF } from '../../utils/export.utils'
import ExcelJS from 'exceljs'
import { emitNewOrder } from '../../utils/socket'

// FIFO transition map: current status → allowed next statuses
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    received: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'preparing', 'cancelled'],
    preparing: ['completed', 'ready'],
    ready: ['completed'],
    completed: [],
    cancelled: []
}

export const createOrderService = async (payload: ICreateOrderBody) => {
    if (!payload.items || payload.items.length === 0) {
        throw new CustomError(responseMessage.order.EMPTY_ITEMS, 422)
    }

    // Server-side price calculation (ignore any client-provided prices)
    const {
        items: calculatedItems,
        subtotalBeforeDiscount,
        taxAfterDiscount,
        grandTotal,
        couponId,
        couponCode,
        discountType,
        discountValue,
        discountAmount,
        subtotalAfterDiscount
    } = await calculateOrderTotal(payload.items, payload.couponCode, payload.customerName)

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    const order = await orderRepository.createOrder({
        orderNumber,
        orderType: payload.orderType,
        customerName: payload.customerName,
        paymentMethod: payload.paymentMethod || 'cash',
        paymentStatus: payload.paymentStatus || 'pending',
        items: calculatedItems,
        subtotal: subtotalBeforeDiscount,
        tax: taxAfterDiscount,
        total: grandTotal,
        coupon_id: couponId,
        coupon_code: couponCode,
        discount_type: discountType,
        discount_value: discountValue,
        discount_amount: discountAmount,
        subtotal_before_discount: subtotalBeforeDiscount,
        subtotal_after_discount: subtotalAfterDiscount,
        tax_after_discount: taxAfterDiscount,
        grand_total: grandTotal
    })

    if (couponId) {
        await couponRepository.incrementUsedCount(couponId.toString())
    }

    // Emit real-time event to Kitchen after DB save succeeds
    emitNewOrder(order)

    return {
        success: true,
        data: order
    }
}

export const getAllOrdersService = async (filter: Record<string, any> = {}) => {
    const orders = await orderRepository.findAllOrders(filter)
    return {
        success: true,
        data: orders
    }
}

const moneyFormat = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
}

export const exportSalesReportService = async (filter: Record<string, any>) => {
    const orders = await orderRepository.findAllOrders(filter)
    const exportType = filter.exportType || 'csv'

    // Format rows
    const data = orders.map((o: any) => ({
        invoiceNumber: o.orderNumber,
        orderNumber: o.orderNumber,
        date: new Date(o.createdAt).toLocaleString(),
        customerName: o.customerName || '—',
        orderType: o.orderType || '—',
        paymentMethod: o.paymentMethod || '—',
        itemsCount: o.items ? o.items.reduce((sum: number, item: any) => sum + item.quantity, 0) : 0,
        subtotal: o.subtotal_before_discount ?? o.subtotal ?? 0,
        couponCode: o.coupon_code || '—',
        discount: o.discount_amount || 0,
        tax: o.tax_after_discount ?? o.tax ?? 0,
        total: o.grand_total ?? o.total ?? 0,
        status: o.status || '—'
    }))

    const summaryTotals = [
        { label: 'Total Orders', value: orders.length },
        { label: 'Total Revenue', value: data.reduce((sum, d) => sum + d.total, 0) },
        { label: 'Total Discount', value: data.reduce((sum, d) => sum + d.discount, 0) },
        { label: 'Total Tax', value: data.reduce((sum, d) => sum + d.tax, 0) },
        { label: 'Net Revenue', value: data.reduce((sum, d) => sum + d.total, 0) }
    ]

    const filterList: { label: string; value: string }[] = []
    if (filter.status && filter.status !== 'all') filterList.push({ label: 'Status', value: filter.status })
    if (filter.paymentMethod && filter.paymentMethod !== 'all') filterList.push({ label: 'Payment Method', value: filter.paymentMethod })
    if (filter.startDate) filterList.push({ label: 'From', value: filter.startDate })
    if (filter.endDate) filterList.push({ label: 'To', value: filter.endDate })
    if (filter.search) filterList.push({ label: 'Search', value: filter.search })

    if (exportType === 'csv') {
        const headers = [
            'Invoice Number',
            'Order Number',
            'Date',
            'Customer Name',
            'Order Type',
            'Payment Method',
            'Items Count',
            'Subtotal',
            'Coupon Code',
            'Discount',
            'Tax',
            'Grand Total',
            'Status'
        ]
        const rows = data.map(d => [
            d.invoiceNumber,
            d.orderNumber,
            d.date,
            d.customerName,
            d.orderType,
            d.paymentMethod,
            d.itemsCount,
            moneyFormat(d.subtotal),
            d.couponCode,
            moneyFormat(d.discount),
            moneyFormat(d.tax),
            moneyFormat(d.total),
            d.status
        ])
        
        // Append summary totals to the CSV
        rows.push([])
        rows.push(['SUMMARY TOTALS'])
        summaryTotals.forEach(s => {
            rows.push([s.label, typeof s.value === 'number' && s.label !== 'Total Orders' ? moneyFormat(s.value) : s.value])
        })

        const content = generateCSV(headers, rows)
        return { type: 'csv', content }
    } else if (exportType === 'xlsx') {
        const columns = [
            { header: 'Invoice Number', key: 'invoiceNumber' },
            { header: 'Order Number', key: 'orderNumber' },
            { header: 'Date', key: 'date' },
            { header: 'Customer Name', key: 'customerName' },
            { header: 'Order Type', key: 'orderType' },
            { header: 'Payment Method', key: 'paymentMethod' },
            { header: 'Items Count', key: 'itemsCount' },
            { header: 'Subtotal', key: 'subtotalFormatted' },
            { header: 'Coupon Code', key: 'couponCode' },
            { header: 'Discount', key: 'discountFormatted' },
            { header: 'Tax', key: 'taxFormatted' },
            { header: 'Grand Total', key: 'totalFormatted' },
            { header: 'Status', key: 'status' }
        ]

        const formattedData = data.map(d => ({
            ...d,
            subtotalFormatted: moneyFormat(d.subtotal),
            discountFormatted: moneyFormat(d.discount),
            taxFormatted: moneyFormat(d.tax),
            totalFormatted: moneyFormat(d.total)
        }))

        const formattedSummary = summaryTotals.map(s => ({
            label: s.label,
            value: typeof s.value === 'number' && s.label !== 'Total Orders' ? moneyFormat(s.value) : s.value
        }))

        const content = await generateExcel('Sales Report', columns, formattedData, formattedSummary)
        return { type: 'xlsx', content }
    } else {
        // PDF
        const columns = [
            { header: 'Invoice', width: 85, field: 'invoiceNumber' },
            { header: 'Date', width: 90, field: 'date' },
            { header: 'Customer', width: 65, field: 'customerName' },
            { header: 'Type', width: 40, field: 'orderType' },
            { header: 'Payment', width: 40, field: 'paymentMethod' },
            { header: 'Qty', width: 25, field: 'itemsCount', align: 'center' as const },
            { header: 'Subtotal', width: 50, field: 'subtotalFormatted', align: 'right' as const },
            { header: 'Coupon', width: 50, field: 'couponCode' },
            { header: 'Discount', width: 50, field: 'discountFormatted', align: 'right' as const },
            { header: 'Tax', width: 45, field: 'taxFormatted', align: 'right' as const },
            { header: 'Total', width: 50, field: 'totalFormatted', align: 'right' as const },
            { header: 'Status', width: 40, field: 'status' }
        ]

        const formattedData = data.map(d => ({
            ...d,
            subtotalFormatted: moneyFormat(d.subtotal),
            discountFormatted: moneyFormat(d.discount),
            taxFormatted: moneyFormat(d.tax),
            totalFormatted: moneyFormat(d.total)
        }))

        const formattedSummary = summaryTotals.map(s => ({
            label: s.label,
            value: typeof s.value === 'number' && s.label !== 'Total Orders' ? moneyFormat(s.value) : s.value
        }))

        const content = await generatePDF('Sales Report', columns, formattedData, formattedSummary, filterList)
        return { type: 'pdf', content }
    }
}

export const exportTransactionsReportService = async (filter: Record<string, any>) => {
    const orders = await orderRepository.findAllOrders(filter)
    const exportType = filter.exportType || 'csv'

    const data = orders.map((o: any) => ({
        transactionId: o._id.toString(),
        orderNumber: o.orderNumber,
        date: new Date(o.createdAt).toLocaleString(),
        customer: o.customerName || '—',
        paymentMethod: o.paymentMethod || '—',
        status: o.paymentStatus || '—',
        amount: o.subtotal_before_discount ?? o.subtotal ?? 0,
        tax: o.tax_after_discount ?? o.tax ?? 0,
        discount: o.discount_amount ?? 0,
        total: o.grand_total ?? o.total ?? 0,
        coupon: o.coupon_code || '—'
    }))

    const grossSales = orders.reduce((sum: number, o: any) => sum + (o.subtotal_before_discount ?? o.subtotal ?? 0), 0)
    const totalDiscounts = orders.reduce((sum: number, o: any) => sum + (o.discount_amount ?? 0), 0)
    const totalTax = orders.reduce((sum: number, o: any) => sum + (o.tax_after_discount ?? o.tax ?? 0), 0)
    const netSales = orders.reduce((sum: number, o: any) => sum + (o.grand_total ?? o.total ?? 0), 0)

    const monthlyGroups: Record<string, { count: number; netSales: number }> = {}
    orders.forEach((o: any) => {
        const date = new Date(o.createdAt)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const monthKey = `${year}-${month}`
        
        if (!monthlyGroups[monthKey]) {
            monthlyGroups[monthKey] = { count: 0, netSales: 0 }
        }
        monthlyGroups[monthKey].count += 1
        monthlyGroups[monthKey].netSales += (o.grand_total ?? o.total ?? 0)
    })
    
    const monthlyBreakdown = Object.entries(monthlyGroups)
        .map(([month, data]) => ({
            month,
            transactions: data.count,
            netSales: data.netSales,
            profit: 'N/A'
        }))
        .sort((a, b) => a.month.localeCompare(b.month))

    const dateRange = filter.startDate && filter.endDate 
        ? `${filter.startDate} to ${filter.endDate}` 
        : 'All Time'

    const successfulTransactions = data.filter(d => d.status === 'paid').length
    const failedTransactions = data.filter(d => d.status === 'failed').length

    const summaryTotals = [
        { label: 'Total Transactions', value: orders.length },
        { label: 'Successful Transactions', value: successfulTransactions },
        { label: 'Failed Transactions', value: failedTransactions },
        { label: 'Total Collected', value: data.reduce((sum, d) => d.status === 'paid' ? sum + d.total : sum, 0) },
        { label: 'Total Discount', value: data.reduce((sum, d) => sum + d.discount, 0) },
        { label: 'Total Tax', value: data.reduce((sum, d) => sum + d.tax, 0) }
    ]

    const filterList: { label: string; value: string }[] = []
    if (filter.status && filter.status !== 'all') filterList.push({ label: 'Status', value: filter.status })
    if (filter.paymentMethod && filter.paymentMethod !== 'all') filterList.push({ label: 'Payment Method', value: filter.paymentMethod })
    if (filter.startDate) filterList.push({ label: 'From', value: filter.startDate })
    if (filter.endDate) filterList.push({ label: 'To', value: filter.endDate })
    if (filter.search) filterList.push({ label: 'Search', value: filter.search })

    if (exportType === 'csv') {
        const headers = [
            'Transaction ID',
            'Order Number',
            'Date',
            'Customer',
            'Payment Method',
            'Transaction Status',
            'Subtotal',
            'Tax',
            'Discount',
            'Final Amount',
            'Coupon Code'
        ]
        const rows = data.map(d => [
            d.transactionId,
            d.orderNumber,
            d.date,
            d.customer,
            d.paymentMethod,
            d.status,
            moneyFormat(d.amount),
            moneyFormat(d.tax),
            moneyFormat(d.discount),
            moneyFormat(d.total),
            d.coupon
        ])

        rows.push([])
        rows.push(['SUMMARY TOTALS'])
        summaryTotals.forEach(s => {
            rows.push([s.label, typeof s.value === 'number' && !s.label.includes('Transactions') ? moneyFormat(s.value) : s.value])
        })

        rows.push([])
        rows.push(['MONTHLY SALES BREAKDOWN'])
        rows.push(['Month', 'Transactions', 'Gross Sales', 'Discounts', 'Tax', 'Net Sales', 'AOV'])
        const richMonthlyForCsv: Record<string, { count: number; grossSales: number; discounts: number; tax: number; netSales: number }> = {}
        orders.forEach((o: any) => {
            const d = new Date(o.createdAt)
            const sk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            if (!richMonthlyForCsv[sk]) richMonthlyForCsv[sk] = { count: 0, grossSales: 0, discounts: 0, tax: 0, netSales: 0 }
            richMonthlyForCsv[sk].count      += 1
            richMonthlyForCsv[sk].grossSales += (o.subtotal_before_discount ?? o.subtotal ?? 0)
            richMonthlyForCsv[sk].discounts  += (o.discount_amount ?? 0)
            richMonthlyForCsv[sk].tax        += (o.tax_after_discount ?? o.tax ?? 0)
            richMonthlyForCsv[sk].netSales   += (o.grand_total ?? o.total ?? 0)
        })
        const MONTHS_CSV = ['January','February','March','April','May','June','July','August','September','October','November','December']
        Object.entries(richMonthlyForCsv).sort(([a],[b]) => a.localeCompare(b)).forEach(([sk, g]) => {
            const [yr, mo] = sk.split('-')
            const rowAov = g.count > 0 ? g.netSales / g.count : 0
            rows.push([`${MONTHS_CSV[Number(mo)-1]} ${yr}`, g.count, moneyFormat(g.grossSales), `-${moneyFormat(g.discounts)}`, moneyFormat(g.tax), moneyFormat(g.netSales), moneyFormat(rowAov)])
        })

        const content = generateCSV(headers, rows)
        return { type: 'csv', content }
    } else if (exportType === 'xlsx') {
        const workbook = new ExcelJS.Workbook()
        workbook.creator = 'QuickCrave POS'
        workbook.created = new Date()

        // ── Sheet 1: Transactions Data ────────────────────────────────────────
        const dataSheet = workbook.addWorksheet('Transactions')
        const txColumns = [
            { header: 'Transaction ID',     key: 'transactionId',    width: 28 },
            { header: 'Order Number',        key: 'orderNumber',      width: 18 },
            { header: 'Date & Time',         key: 'date',             width: 24 },
            { header: 'Customer',            key: 'customer',         width: 22 },
            { header: 'Order Type',          key: 'orderType',        width: 14 },
            { header: 'Payment Method',      key: 'paymentMethod',    width: 18 },
            { header: 'Payment Status',      key: 'status',           width: 16 },
            { header: 'Items',               key: 'items',            width: 40 },
            { header: 'Subtotal (Gross)',     key: 'subtotal',         width: 18 },
            { header: 'Discount',            key: 'discount',         width: 16 },
            { header: 'Coupon Code',         key: 'coupon',           width: 16 },
            { header: 'Tax (10%)',           key: 'tax',              width: 14 },
            { header: 'Net Sales (Total)',   key: 'total',            width: 20 },
        ]

        dataSheet.columns = txColumns
        dataSheet.views = [{ state: 'frozen', ySplit: 1 }]

        // Styled header row
        const txHeader = dataSheet.getRow(1)
        txHeader.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
        txHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5511E' } }
        txHeader.alignment = { vertical: 'middle', horizontal: 'center' }
        txHeader.height = 22

        // Build enriched transaction rows with item list from original orders
        const txRows = orders.map((o: any) => ({
            transactionId: o._id.toString(),
            orderNumber:   o.orderNumber,
            date:          new Date(o.createdAt).toLocaleString(),
            customer:      o.customerName || '—',
            orderType:     o.orderType === 'eat-in' ? 'Dine In' : o.orderType === 'take-away' ? 'Take Away' : '—',
            paymentMethod: o.paymentMethod || '—',
            status:        o.paymentStatus || '—',
            items:         (o.items || []).map((i: any) => `${i.name} ×${i.quantity}`).join(', '),
            subtotal:      moneyFormat(o.subtotal_before_discount ?? o.subtotal ?? 0),
            discount:      o.discount_amount ? `-${moneyFormat(o.discount_amount)}` : '—',
            coupon:        o.coupon_code || '—',
            tax:           moneyFormat(o.tax_after_discount ?? o.tax ?? 0),
            total:         moneyFormat(o.grand_total ?? o.total ?? 0),
        }))

        txRows.forEach((item: Record<string, any>) => {
            const row = dataSheet.addRow(item)
            row.alignment = { vertical: 'middle', wrapText: false }
        })

        // Auto-width columns
        txColumns.forEach((col, idx) => {
            const column = dataSheet.getColumn(idx + 1)
            let maxLen = String(col.header).length
            column.eachCell({ includeEmpty: false }, (cell) => {
                const len = cell.value ? String(cell.value).length : 0
                if (len > maxLen) maxLen = len
            })
            column.width = Math.min(Math.max(maxLen + 3, col.width), 55)
        })

        // Totals footer
        dataSheet.addRow([])
        const totalsLabel = dataSheet.addRow({ transactionId: '── TOTALS ──', subtotal: moneyFormat(grossSales), discount: `-${moneyFormat(totalDiscounts)}`, tax: moneyFormat(totalTax), total: moneyFormat(netSales) })
        totalsLabel.font = { bold: true }
        totalsLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3E0' } }

        // ── Sheet 2: Analytics Summary ────────────────────────────────────────
        const successfulTx = orders.filter((o: any) => o.paymentStatus === 'paid').length
        const cancelledTx  = orders.filter((o: any) => o.status === 'cancelled').length
        const cashOrders   = orders.filter((o: any) => o.paymentMethod === 'cash').length
        const cardOrders   = orders.filter((o: any) => o.paymentMethod === 'card').length
        const couponOrders = orders.filter((o: any) => o.coupon_code).length
        const aov = orders.length > 0 ? netSales / orders.length : 0

        const summarySheet = workbook.addWorksheet('Analytics Summary')
        summarySheet.getColumn(1).width = 35
        summarySheet.getColumn(2).width = 28

        const addSummaryTitle = (label: string) => {
            summarySheet.addRow([])
            const r = summarySheet.addRow([label])
            r.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFF5511E' } }
            r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3E0' } }
        }
        const addSummaryRow = (label: string, value: string | number) => {
            const r = summarySheet.addRow([label, value])
            r.getCell(1).font = { bold: true }
            r.alignment = { horizontal: 'left' }
        }

        const mainTitle = summarySheet.addRow(['Transactions & Analytics Report'])
        mainTitle.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFF5511E' } }
        addSummaryRow('Date Range', dateRange)
        addSummaryRow('Report Generated', new Date().toLocaleString())

        addSummaryTitle('SALES OVERVIEW')
        addSummaryRow('Gross Sales (before discounts)', moneyFormat(grossSales))
        addSummaryRow('Total Discounts / Coupons', `-${moneyFormat(totalDiscounts)}`)
        addSummaryRow('Tax Collected (10%)', moneyFormat(totalTax))
        addSummaryRow('Net Sales (after discounts + tax)', moneyFormat(netSales))
        addSummaryRow('Average Order Value (AOV)', moneyFormat(aov))

        addSummaryTitle('TRANSACTIONS')
        addSummaryRow('Total Transactions', orders.length)
        addSummaryRow('Successful (Paid)', successfulTx)
        addSummaryRow('Cancelled Orders', cancelledTx)

        addSummaryTitle('PAYMENT METHODS')
        addSummaryRow('Cash Orders', cashOrders)
        addSummaryRow('Card Orders', cardOrders)

        addSummaryTitle('COUPON / DISCOUNT IMPACT')
        addSummaryRow('Orders with Coupon', couponOrders)
        addSummaryRow('Orders without Coupon', orders.length - couponOrders)
        addSummaryRow('Total Discount Applied', `-${moneyFormat(totalDiscounts)}`)

        // ── Sheet 3: Monthly Breakdown ─────────────────────────────────────────
        const richMonthlyGroups: Record<string, {
            count: number; grossSales: number; discounts: number; tax: number; netSales: number
        }> = {}
        orders.forEach((o: any) => {
            const d = new Date(o.createdAt)
            const sk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            if (!richMonthlyGroups[sk]) richMonthlyGroups[sk] = { count: 0, grossSales: 0, discounts: 0, tax: 0, netSales: 0 }
            richMonthlyGroups[sk].count      += 1
            richMonthlyGroups[sk].grossSales += (o.subtotal_before_discount ?? o.subtotal ?? 0)
            richMonthlyGroups[sk].discounts  += (o.discount_amount ?? 0)
            richMonthlyGroups[sk].tax        += (o.tax_after_discount ?? o.tax ?? 0)
            richMonthlyGroups[sk].netSales   += (o.grand_total ?? o.total ?? 0)
        })

        const monthlySheet = workbook.addWorksheet('Monthly Breakdown')
        const mthTitle = monthlySheet.addRow(['Monthly Sales Performance'])
        mthTitle.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFF5511E' } }
        monthlySheet.addRow([])

        const mthHeader = monthlySheet.addRow(['Month', 'Transactions', 'Gross Sales', 'Discounts', 'Tax', 'Net Sales', 'AOV'])
        mthHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        mthHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5511E' } }
        mthHeader.alignment = { horizontal: 'center' }

        Object.entries(richMonthlyGroups)
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([sk, g]) => {
                const [yr, mo] = sk.split('-')
                const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
                const monthLabel = `${MONTHS[Number(mo) - 1]} ${yr}`
                const rowAov = g.count > 0 ? g.netSales / g.count : 0
                monthlySheet.addRow([
                    monthLabel,
                    g.count,
                    moneyFormat(g.grossSales),
                    `-${moneyFormat(g.discounts)}`,
                    moneyFormat(g.tax),
                    moneyFormat(g.netSales),
                    moneyFormat(rowAov),
                ])
            })

        monthlySheet.columns = [
            { width: 20 }, { width: 14 }, { width: 20 },
            { width: 18 }, { width: 16 }, { width: 20 }, { width: 18 }
        ]

        const content = await workbook.xlsx.writeBuffer()
        return { type: 'xlsx', content }
    } else {
        // PDF
        const columns = [
            { header: 'Transaction ID', width: 95, field: 'transactionId' },
            { header: 'Order Num', width: 85, field: 'orderNumber' },
            { header: 'Date', width: 95, field: 'date' },
            { header: 'Customer', width: 75, field: 'customer' },
            { header: 'Payment', width: 40, field: 'paymentMethod' },
            { header: 'Status', width: 40, field: 'status' },
            { header: 'Subtotal', width: 50, field: 'amountFormatted', align: 'right' as const },
            { header: 'Tax', width: 45, field: 'taxFormatted', align: 'right' as const },
            { header: 'Discount', width: 50, field: 'discountFormatted', align: 'right' as const },
            { header: 'Final Amount', width: 50, field: 'totalFormatted', align: 'right' as const },
            { header: 'Coupon', width: 40, field: 'coupon' }
        ]

        const formattedData = data.map(d => ({
            ...d,
            amountFormatted: moneyFormat(d.amount),
            taxFormatted: moneyFormat(d.tax),
            discountFormatted: moneyFormat(d.discount),
            totalFormatted: moneyFormat(d.total)
        }))

        const formattedSummary = summaryTotals.map(s => ({
            label: s.label,
            value: typeof s.value === 'number' && !s.label.includes('Transactions') ? moneyFormat(s.value) : s.value
        }))

        const content = await generatePDF('Transactions Report', columns, formattedData, formattedSummary, filterList, {
            monthlyBreakdown,
            grossSales,
            totalDiscounts,
            totalTax,
            netSales,
            dateRange
        })
        return { type: 'pdf', content }
    }
}

export const getOrderByIdService = async (id: string) => {
    await validate.orderNotFound(id)
    const order = await orderRepository.findOrderById(id)
    return {
        success: true,
        data: order
    }
}

/**
 * Returns active kitchen orders sorted by createdAt ASC (FIFO).
 * Excludes completed and cancelled orders from the kitchen view.
 */
export const getKitchenOrdersService = async () => {
    const orders = await orderRepository.findKitchenOrders()
    return {
        success: true,
        data: orders
    }
}

/**
 * Returns completed kitchen orders sorted by completedAt DESC, fallback to createdAt DESC.
 */
export const getCompletedOrdersService = async () => {
    const orders = await orderRepository.findCompletedOrders()
    return {
        success: true,
        data: orders
    }
}

export const updateOrderStatusService = async (id: string, newStatus: string) => {
    const order = await orderRepository.findOrderById(id)
    if (!order) {
        throw new CustomError(responseMessage.NOT_FOUND('Order'), 404)
    }

    const currentStatus = order.status as string
    const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? []

    if (!allowed.includes(newStatus)) {
        throw new CustomError(
            `Cannot transition order from '${currentStatus}' to '${newStatus}'. Allowed: ${allowed.join(', ') || 'none'}`,
            422
        )
    }

    const updatedOrder = await orderRepository.updateOrderStatusById(id, newStatus)
    return {
        success: true,
        data: updatedOrder
    }
}
