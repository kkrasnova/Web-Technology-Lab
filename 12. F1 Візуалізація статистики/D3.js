// Ініціалізація карти
const map = L.map('map').setView([49.0, 31.0], 6);

// Додавання шару тайлів OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Функція для створення міні-діаграми
function createMiniChart(data, container, title) {
  // Налаштування розмірів та відступів діаграми
  const width = 300;
  const height = 200;
  const margin = { top: 40, right: 20, bottom: 50, left: 50 };

  // Створення SVG елементу
  const svg = d3.select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Налаштування шкал для осей
  const x = d3.scaleBand()
    .range([margin.left, width - margin.right])
    .padding(0.1);

  const y = d3.scaleLinear()
    .range([height - margin.bottom, margin.top]);

  // Встановлення доменів для шкал
  x.domain(data.map(d => d.category));
  y.domain([0, d3.max(data, d => d.value)]);

  // Додавання заголовку діаграми
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text(title);

  // Додавання осей
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(5));

  // Додаємо стовпчики з анімацією та інтерактивністю
  svg.selectAll(".bar")
    .data(data)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.category))
    .attr("y", height - margin.bottom)
    .attr("width", x.bandwidth())
    .attr("height", 0)
    .attr("fill", d => d.color || "steelblue")
    .transition()
    .duration(1000)
    .attr("y", d => y(d.value))
    .attr("height", d => height - margin.bottom - y(d.value))
    .selection() // Повертаємось до вибору після transition
    .on("mouseover", function(event, d) {
      showTooltip(event, d, this);
    })
    .on("mouseout", hideTooltip);

  // Додаємо підписи значень
  svg.selectAll(".value-label")
    .data(data)
    .enter().append("text")
    .attr("class", "value-label")
    .attr("x", d => x(d.category) + x.bandwidth() / 2)
    .attr("y", d => y(d.value) - 5)
    .attr("text-anchor", "middle")
    .text(d => d.value)
    .style("font-size", "12px")
    .style("fill", "black");

  // Додаємо контейнер для підказки
  const tooltip = d3.select(container)
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // Функція для показу підказки
  function showTooltip(event, d, element) {
    const [x, y] = d3.pointer(event, container);
    tooltip.transition()
      .duration(200)
      .style("opacity", .9);
    tooltip.html(`${d.category}: ${d.value}%<br>${d.description}`)
      .style("left", (x + 10) + "px")
      .style("top", (y - 28) + "px");
    d3.select(element).attr("opacity", 0.7);
  }

  // Функція для приховування підказки
  function hideTooltip() {
    tooltip.transition()
      .duration(500)
      .style("opacity", 0);
    d3.select(this).attr("opacity", 1);
  }
}

// Функція для додавання міні-діаграми до маркера
function addChartToMarker(marker, data, title) {
  const chartContainer = L.DomUtil.create('div', 'chart-container');
  createMiniChart(data, chartContainer, title);
  
  // Додаємо легенду
  const legend = L.DomUtil.create('div', 'chart-legend', chartContainer);
  data.forEach(d => {
    const item = L.DomUtil.create('div', 'legend-item', legend);
    const colorBox = L.DomUtil.create('span', 'color-box', item);
    colorBox.style.backgroundColor = d.color || "steelblue";
    item.appendChild(document.createTextNode(` ${d.category}: ${d.description || ''}`));
  });
  
  marker.bindPopup(chartContainer, { 
    maxWidth: 350, // Збільшено максимальну ширину
    maxHeight: 400 // Збільшено максимальну висоту
  });
}

// Приклад використання
const kyivData = [
  { category: '0-14', value: 16.5, color: "#66c2a5", description: "Діти (0-14 років)" },
  { category: '15-64', value: 68.2, color: "#fc8d62", description: "Працездатне населення (15-64 роки)" },
  { category: '65+', value: 15.3, color: "#8da0cb", description: "Пенсіонери (65+ років)" }
];

const kyivMarker = L.marker([50.4501, 30.5234]).addTo(map);
addChartToMarker(kyivMarker, kyivData, 'Вікова структура населення Києва (%)');

const lvivData = [
  { category: '0-14', value: 15.8, color: "#66c2a5", description: "Діти (0-14 років)" },
  { category: '15-64', value: 69.5, color: "#fc8d62", description: "Працездатне населення (15-64 роки)" },
  { category: '65+', value: 14.7, color: "#8da0cb", description: "Пенсіонери (65+ років)" }
];

const lvivMarker = L.marker([49.8397, 24.0297]).addTo(map);
addChartToMarker(lvivMarker, lvivData, 'Вікова структура населення Львова (%)');

const kharkivData = [
  { category: '0-14', value: 14.2, color: "#66c2a5", description: "Діти (0-14 років)" },
  { category: '15-64', value: 70.1, color: "#fc8d62", description: "Працездатне населення (15-64 роки)" },
  { category: '65+', value: 15.7, color: "#8da0cb", description: "Пенсіонери (65+ років)" }
];

const kharkivMarker = L.marker([49.9935, 36.2304]).addTo(map);
addChartToMarker(kharkivMarker, kharkivData, 'Вікова структура населення Харкова (%)');
