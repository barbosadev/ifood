import { useState, useRef } from 'react';
import './App.css';
import { Analytics } from "@vercel/analytics/react"

function App() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const resultsRef = useRef(null);

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

  const generateImage = async () => {
    if (!results) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      
      // Criar um container temporário para a imagem
      const storyContainer = document.createElement('div');
      storyContainer.style.width = '1080px';
      storyContainer.style.height = '1920px';
      storyContainer.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      storyContainer.style.padding = '60px 40px';
      storyContainer.style.boxSizing = 'border-box';
      storyContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      storyContainer.style.position = 'fixed';
      storyContainer.style.left = '-9999px';
      storyContainer.style.top = '0';
      storyContainer.style.display = 'flex';
      storyContainer.style.alignItems = 'center';
      storyContainer.style.justifyContent = 'center';
      
      storyContainer.innerHTML = `
        <div style="background: white; border-radius: 30px; padding: 50px 40px; max-height: 60%; height: 100%; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 30px 80px rgba(0, 0, 0, 0.3);">
          <div>
            <h1 style="text-align: center; color: #333; margin: 0 0 20px 0; font-size: 3.5rem; font-weight: 800;">
              Meu iFood 2025 📊
            </h1>
            <p style="text-align: center; color: #666; margin: 0 0 50px 0; font-size: 1.5rem;">
              Análise completa dos meus pedidos
            </p>
          </div>
          
          <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 25px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 35px; border-radius: 20px; text-align: center; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3); display: flex; flex-direction: column; justify-content: center; align-items: center;">
              <div style="font-size: 2rem; color: rgba(255,255,255,0.9); margin-bottom: 10px; font-weight: 600;">💰 Gastei no total</div>
              <div style="font-size: 5rem; font-weight: 900; color: white; margin: 10px 0;">R$ ${results.totalSpent}</div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px;">
              <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 20px; text-align: center; box-shadow: 0 8px 25px rgba(245, 87, 108, 0.3); display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <div style="font-size: 1.6rem; color: rgba(255,255,255,0.95); margin-bottom: 8px; font-weight: 600;">📦 Pedidos</div>
                <div style="font-size: 3.8rem; font-weight: 900; color: white;">${results.numberOfOrders}</div>
              </div>
              
              <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; border-radius: 20px; text-align: center; box-shadow: 0 8px 25px rgba(79, 172, 254, 0.3); display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <div style="font-size: 1.6rem; color: rgba(255,255,255,0.95); margin-bottom: 8px; font-weight: 600;">📊 Média</div>
                <div style="font-size: 3.2rem; font-weight: 900; color: white;">R$ ${results.averagePerOrder}</div>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px;">
              <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 30px; border-radius: 20px; text-align: center; box-shadow: 0 8px 25px rgba(250, 112, 154, 0.3); display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <div style="font-size: 1.6rem; color: rgba(255,255,255,0.95); margin-bottom: 8px; font-weight: 600;">⬆️ Mais caro</div>
                <div style="font-size: 3rem; font-weight: 900; color: white;">R$ ${results.mostExpensive.value}</div>
              </div>
              
              <div style="background: linear-gradient(135deg, #30cfd0 0%, #330867 100%); padding: 30px; border-radius: 20px; text-align: center; box-shadow: 0 8px 25px rgba(48, 207, 208, 0.3); display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <div style="font-size: 1.6rem; color: rgba(255,255,255,0.95); margin-bottom: 8px; font-weight: 600;">⬇️ Mais barato</div>
                <div style="font-size: 3rem; font-weight: 900; color: white;">R$ ${results.cheapest.value}</div>
              </div>
            </div>
            
            <div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); padding: 30px; border-radius: 20px; text-align: center; box-shadow: 0 8px 25px rgba(168, 237, 234, 0.3); display: flex; flex-direction: column; justify-content: center; align-items: center;">
              <div style="font-size: 1.8rem; color: #333; margin-bottom: 8px; font-weight: 600;">📅 Média mensal</div>
              <div style="font-size: 3.5rem; font-weight: 900; color: #667eea;">${results.averageOrdersPerMonth} pedidos</div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 40px;">
            <p style="font-size: 1.4rem; color: #888; margin: 0; font-weight: 600;">Gerado em www.retro-aifood.com</p>
          </div>
        </div>
      `;
      
      document.body.appendChild(storyContainer);
      
      const canvas = await html2canvas(storyContainer, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        width: 1080,
        height: 1920,
      });
      
      document.body.removeChild(storyContainer);
      
      const link = document.createElement('a');
      link.download = `meu-ifood-2025.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Erro ao gerar imagem:', err);
      alert('Erro ao gerar imagem. Tente novamente.');
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
            <strong>⚠️ Importante: Este processo precisa ser feito no computador (não funciona em celulares).</strong>
          </p>
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
            <div className="results" ref={resultsRef}>
              
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
            
            <div className="share-section">
              <button onClick={generateImage} className="share-button">
                📸 Gerar Imagem para Compartilhar
              </button>
              <p className="share-note">
                Clique no botão acima para salvar uma imagem com seus resultados e compartilhar nas redes sociais!
              </p>
            </div>
          </>
        )}
      </div>
      <Analytics />
    </div>
  );
}

export default App;
