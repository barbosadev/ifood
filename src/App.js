import { useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import './App.css';

function App() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const fetchDeliveries = async (bearerToken, page = 0) => {
    const myHeaders = new Headers();
    myHeaders.append("authorization", `Bearer ${bearerToken}`);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow"
    };

    const response = await fetch(`https://cw-marketplace.ifood.com.br/v4/customers/me/orders?page=${page}&size=25`, requestOptions);
    const result = await response.json();
    
    return result.map((order) => {
      return { value: order.payments.total.value, createdAt: order.createdAt, lastStatus: order.lastStatus };
    });
  };

  const handleAnalyze = async () => {
    if (!token.trim()) {
      setError('Por favor, insira um token válido');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      let hasLastYearOrder = false;
      const thisYearOrders = [];

      for (let page = 0; !hasLastYearOrder; page++) {
        const deliveries = await fetchDeliveries(token, page);

        if (deliveries.some((delivery) => {
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

      const totalSpent = thisYearOrders.reduce((acc, order) => acc + order.value, 0);

      const mostExpensiveOrder = thisYearOrders.reduce((prev, current) => {
        return (prev.value > current.value) ? prev : current;
      });

      const cheapestOrder = thisYearOrders.reduce((prev, current) => {
        return (prev.value < current.value) ? prev : current;
      });

      const ordersByMonth = {};
      thisYearOrders.forEach((order) => {
        const orderDate = new Date(order.createdAt);
        const month = orderDate.getMonth() + 1;
        if (!ordersByMonth[month]) {
          ordersByMonth[month] = 0;
        }
        ordersByMonth[month]++;
      });

      const averageOrdersPerMonth = Object.values(ordersByMonth).reduce((acc, count) => acc + count, 0) / Object.keys(ordersByMonth).length;

      const monthWithMostOrders = Object.keys(ordersByMonth).reduce((prev, current) => {
        return (ordersByMonth[prev] > ordersByMonth[current]) ? prev : current;
      });

      const monthWithLeastOrders = Object.keys(ordersByMonth).reduce((prev, current) => {
        return (ordersByMonth[prev] < ordersByMonth[current]) ? prev : current;
      });

      const daysInYear = 365;
      const averageDailySpending = totalSpent / daysInYear;

      setResults({
        totalSpent: (totalSpent / 100).toFixed(2),
        numberOfOrders: thisYearOrders.length,
        averagePerOrder: (totalSpent / thisYearOrders.length / 100).toFixed(2),
        mostExpensive: {
          value: (mostExpensiveOrder.value / 100).toFixed(2),
          date: new Date(mostExpensiveOrder.createdAt).toLocaleDateString('pt-BR')
        },
        cheapest: {
          value: (cheapestOrder.value / 100).toFixed(2),
          date: new Date(cheapestOrder.createdAt).toLocaleDateString('pt-BR')
        },
        averageOrdersPerMonth: averageOrdersPerMonth.toFixed(2),
        monthWithMostOrders: {
          month: monthWithMostOrders,
          count: ordersByMonth[monthWithMostOrders]
        },
        monthWithLeastOrders: {
          month: monthWithLeastOrders,
          count: ordersByMonth[monthWithLeastOrders]
        },
        averageDailySpending: (averageDailySpending / 100).toFixed(2)
      });
    } catch (err) {
      setError('Erro ao buscar dados. Verifique se o token está correto.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <h1>Análise de Pedidos iFood 2025</h1>
        
        <div className="github-link">
          🔍 <a href="https://github.com/barbosadev/ifood" target="_blank" rel="noopener noreferrer">
            Ver código-fonte no GitHub
          </a> - Audite o código e garanta que não fazemos nada malicioso com seu token
        </div>
        
        <div className="tutorial-section">
          <h2>📖 Como obter seu Token de Autorização</h2>
          <p className="tutorial-intro">
            Siga os passos abaixo para copiar seu token de autorização do iFood:
          </p>
          <ol className="tutorial-steps">
            <li>
              <strong>Acesse o site:</strong> Abra o navegador e vá para{' '}
              <a href="https://www.ifood.com.br/pedidos" target="_blank" rel="noopener noreferrer">
                ifood.com.br/pedidos
              </a>
            </li>
            <li>
              <strong>Faça login:</strong> Entre com sua conta do iFood
            </li>
            <li>
              <strong>Abra o DevTools:</strong> Pressione <kbd>F12</kbd> (Windows/Linux) ou{' '}
              <kbd>Cmd + Option + I</kbd> (Mac)
            </li>
            <li>
              <strong>Vá para a aba Network:</strong> Clique na aba "Network" (ou "Rede") no DevTools
            </li>
            <li>
              <strong>Recarregue a página:</strong> Pressione <kbd>F5</kbd> ou <kbd>Cmd + R</kbd>
            </li>
            <li>
              <strong>Filtre por "orders":</strong> No campo de busca do Network, digite "orders"
            </li>
            <li>
              <strong>Selecione a requisição:</strong> Clique em uma requisição que comece com "orders?page="
            </li>
            <li>
              <strong>Copie o token:</strong> Na aba "Headers" (ou "Cabeçalhos"), procure por{' '}
              <code>authorization</code>, copie o valor após "Bearer " (sem incluir a palavra "Bearer")
              <div className="tutorial-image">
                <img src="/print.png" alt="Exemplo de onde encontrar o token no DevTools" />
                <p className="image-caption">Exemplo: O token aparece no campo Authorization</p>
              </div>
            </li>
            <li>
              <strong>Cole abaixo:</strong> Cole o token no campo abaixo e clique em "Analisar Pedidos"
            </li>
          </ol>
          <div className="tutorial-note">
            ⚠️ <strong>Importante:</strong> Seu token é pessoal e dá acesso à sua conta. 
            Não compartilhe com outras pessoas. Este site processa tudo localmente no seu navegador.
          </div>
        </div>

        <div className="input-section">
          <label htmlFor="token">Cole seu token de autorização:</label>
          <input
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Cole o token JWT aqui..."
            rows="5"
            type="password"
          />
          <button onClick={handleAnalyze} disabled={loading}>
            {loading ? 'Analisando...' : 'Analisar Pedidos'}
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {results && (
          <>
            <h2>Resultados da Análise</h2>
            <div className="results">
              
              <div className="result-card">
                <h3>💰 Gastos Totais</h3>
                <p className="big-number">R$ {results.totalSpent}</p>
              </div>

              <div className="result-card">
                <h3>📦 Número de Pedidos</h3>
                <p className="big-number">{results.numberOfOrders}</p>
              </div>

              <div className="result-card">
                <h3>📊 Gasto Médio por Pedido</h3>
                <p className="big-number">R$ {results.averagePerOrder}</p>
              </div>

              <div className="result-card">
                <h3>⬆️ Pedido Mais Caro</h3>
                <p>R$ {results.mostExpensive.value}</p>
                <p className="date">{results.mostExpensive.date}</p>
              </div>

              <div className="result-card">
                <h3>⬇️ Pedido Mais Barato</h3>
                <p>R$ {results.cheapest.value}</p>
                <p className="date">{results.cheapest.date}</p>
              </div>

              <div className="result-card">
                <h3>📅 Média de Pedidos por Mês</h3>
                <p className="big-number">{results.averageOrdersPerMonth}</p>
              </div>

              <div className="result-card">
                <h3>📈 Mês com Mais Pedidos</h3>
                <p>Mês {results.monthWithMostOrders.month}</p>
                <p className="count">{results.monthWithMostOrders.count} pedidos</p>
              </div>

              <div className="result-card">
                <h3>📉 Mês com Menos Pedidos</h3>
                <p>Mês {results.monthWithLeastOrders.month}</p>
                <p className="count">{results.monthWithLeastOrders.count} pedidos</p>
              </div>

              <div className="result-card">
                <h3>📆 Média Diária de Gastos</h3>
                <p className="big-number">R$ {results.averageDailySpending}</p>
              </div>
            </div>
          </>
        )}
      </div>
      <Analytics />
    </div>
  );
}

export default App;
