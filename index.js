const myHeaders = new Headers();

myHeaders.append("authorization", "Bearer ");

const requestOptions = {
  method: "GET",
  headers: myHeaders,
  redirect: "follow"
};

const fetchDeliveries = async (page = 0) => {
    return fetch(`https://cw-marketplace.ifood.com.br/v4/customers/me/orders?page=${page}&size=25`, requestOptions)
    .then((response) => response.json())
    .then((result) => {
        const orders = result.map((order) => {
            return { value: order.payments.total.value, createdAt: order.createdAt, lastStatus: order.lastStatus };
        });
        return orders;
    })
    .catch((error) => console.error(error));
}

let hasLastYearOrder = false;
const thisYearOrders = [];

for (let page = 0; !hasLastYearOrder; page++) {
    const deliveries = await fetchDeliveries(page);

    if(deliveries.some((delivery) => {
        const deliveryDate = new Date(delivery.createdAt);
        return deliveryDate.getFullYear() < 2025;
    })) {
        hasLastYearOrder = true;
    }

    const filteredDeliveriesByDate = deliveries.filter((delivery) => {
        const deliveryDate = new Date(delivery.createdAt);
        return deliveryDate.getFullYear() === 2025;
    });

    const filteredDeliveriesByStatus = filteredDeliveriesByDate.filter((delivery) => {
        return delivery.lastStatus === "CONCLUDED";
    });

    thisYearOrders.push(...filteredDeliveriesByStatus);
}

const totalSpent = thisYearOrders.reduce((acc, order) => {
    return acc + order.value;
}, 0);

// total gasto
console.log(`Total gasto em 2025: R$ ${(totalSpent / 100).toFixed(2)}`);

// numero de pedidos
console.log(`Número de pedidos em 2025: ${thisYearOrders.length}`);

// gasto médio por pedido
console.log(`Gasto médio por pedido em 2025: R$ ${(totalSpent / thisYearOrders.length / 100).toFixed(2)}`);

// pedido mais caro
const mostExpensiveOrder = thisYearOrders.reduce((prev, current) => {
    return (prev.value > current.value) ? prev : current;
});
console.log(`Pedido mais caro em 2025: R$ ${(mostExpensiveOrder.value / 100).toFixed(2)} em ${new Date(mostExpensiveOrder.createdAt).toLocaleDateString()}`);

// pedido mais barato
const cheapestOrder = thisYearOrders.reduce((prev, current) => {
    return (prev.value < current.value) ? prev : current;
});
console.log(`Pedido mais barato em 2025: R$ ${(cheapestOrder.value / 100).toFixed(2)} em ${new Date(cheapestOrder.createdAt).toLocaleDateString()}`);

// média de pedidos por mês
const ordersByMonth = {};
thisYearOrders.forEach((order) => {
    const orderDate = new Date(order.createdAt);
    const month = orderDate.getMonth() + 1;
    if(!ordersByMonth[month]) {
        ordersByMonth[month] = 0;
    }
    ordersByMonth[month]++;
});
const averageOrdersPerMonth = Object.values(ordersByMonth).reduce((acc, count) => acc + count, 0) / Object.keys(ordersByMonth).length;
console.log(`Média de pedidos por mês em 2025: ${averageOrdersPerMonth.toFixed(2)}`);

// mês com mais pedidos
const monthWithMostOrders = Object.keys(ordersByMonth).reduce((prev, current) => {
    return (ordersByMonth[prev] > ordersByMonth[current]) ? prev : current;
});
console.log(`Mês com mais pedidos em 2025: ${monthWithMostOrders} com ${ordersByMonth[monthWithMostOrders]} pedidos`);

// mês com menos pedidos
const monthWithLeastOrders = Object.keys(ordersByMonth).reduce((prev, current) => {
    return (ordersByMonth[prev] < ordersByMonth[current]) ? prev : current;
});
console.log(`Mês com menos pedidos em 2025: ${monthWithLeastOrders} com ${ordersByMonth[monthWithLeastOrders]} pedidos`);

// media diária de gastos
const daysInYear = 365;
const averageDailySpending = totalSpent / daysInYear;
console.log(`Média diária de gastos em 2025: R$ ${(averageDailySpending / 100).toFixed(2)}`);