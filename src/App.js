import React from 'react';
import { Table, Input, Space, Button } from 'antd';
// import Highlighter from 'react-highlight-words';
// import { SearchOutlined } from '@ant-design/icons';
import './App.css';
import 'antd/dist/antd.css';
import data from './data';

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      data: [],
      value: '',
      loading: false,
      columnsCombined: []
    }
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }

  handleSubmit(event) {
    let companyName = this.state.value;
    event.preventDefault();

    this.setState({loading: true})
    fetch(`https://whalewisdom.com/filer/${companyName}#tabholdings_tab_link`, {mode: 'no-cors'}).then(function (response) {
      // The API call was successful!
      return response.text();
    }).then(async (html) => {
   
      // Convert the HTML string into a document object
      var parser = new DOMParser();
      var doc = parser.parseFromString(html, 'text/html');
      var abc = Array.from(doc.getElementById('quarter_one').options)

      let filterQuaters = [];
      let quarterNames = [];
      abc.forEach((item) => {
          if(!item.disabled) {
            if(!item.innerText.includes('Current Combined')) {
              // filterQuaters.push(`https://whalewisdom.com/filer/holdings?id=${companyName}&q1=${item.value}&type_filter=1,2,3,4&symbol=&change_filter=&minimum_ranking=&minimum_shares=&is_etf=0&sc=true&sort=current_mv&order=desc&offset=0&limit=99`)
              //  filterQuaters.push(`https://whalewisdom.com/filer/holdings?id=${companyName}&q1=${item.value}&type_filter=1,2,3,4&sort=current_mv&order=desc&offset=0&limit=100`)
              filterQuaters.push(`https://whalewisdom.com/filer/holdings?id=${companyName}&q1=${item.value}&sort=current_mv&order=desc&offset=0&limit=1000`)
              quarterNames.push(item.innerText);
            }
        }
      })

    // let quarterNames =  ["Q1 2021 13F Filings ", "Q4 2020 13F Filings ", "Q3 2020 13F Filings ", "Q2 2020 13F Filings ", "Q1 2020 13F Filings ", "Q4 2019 13F Filings ", "Q3 2019 13F Filings ", "Q2 2019 13F Filings "]
      
      let result = await Promise.all(filterQuaters.map(async url => {
        const resp = await fetch(url);
        return resp.json();
      }));

      let combinedResult = {};
      let columnsCombined = [ {
        title: 'Symbol',
        dataIndex: 'companyName',
        // sorter: (a, b) => a.companyName.localeComapare(b.companyName),
        onFilter: (value, record) => record.companyName.indexOf(value) === 0,
        // ...this.getColumnSearchProps('companyName'),
      }, {
        title: 'Company Name',
        dataIndex: 'name',
        // sorter: (a, b) => a.name.localeComapare(b.name),
        onFilter: (value, record) => record.name.indexOf(value) === 0,
      }];
      // let result = data;
      result = result.map((item, index) => {
        const fromLast = result.length - 1 - index;
        columnsCombined.push({
          title: quarterNames[fromLast].replace('13F Filings', '').replace(' ', '').trim('').toUpperCase(),
          dataIndex: quarterNames[fromLast],
          sorter: (a, b) => a[quarterNames[fromLast]] - b[quarterNames[fromLast]]
        })
        return {...item, quartername: quarterNames[index]}
      });

      const lastCol = columnsCombined.length - 1;
      columnsCombined.push({
        title: `% Change in Shares ${columnsCombined[lastCol].title} vs ${columnsCombined[lastCol - 1].title}`,
        dataIndex: 'perchange',
        sorter: (a, b) => a.perchange - b.perchange
      }, {
        title: `% Change in price ${columnsCombined[lastCol].title} vs ${columnsCombined[lastCol - 1].title}`,
        dataIndex: 'priceperchange',
        sorter: (a, b) => a.priceperchange - b.priceperchange
      });

      result.forEach((item, index) => {
        const data = item.rows;

        data.forEach((companyItem) => {
          const perChange = companyItem.current_percent_of_portfolio;
          const quarterEndPrice = companyItem.quarter_end_price;
          if(!combinedResult[companyItem.symbol]) {

            
            combinedResult[companyItem.symbol] = {companyName: companyItem.symbol, name: companyItem.name && companyItem.name.toUpperCase(), perchange: companyItem.percent_shares_change && companyItem.percent_shares_change.toFixed(1)}
          }
          combinedResult[companyItem.symbol] = {...combinedResult[companyItem.symbol], [item.quartername]: perChange && perChange.toFixed(1), [`${item.quartername.trim()}_priceChange`]: quarterEndPrice}
        });
        
      })

      Object.keys(combinedResult).forEach((item) => {

        if(combinedResult[item][quarterNames[0]] && combinedResult[item][quarterNames[1]]) { 
          combinedResult[item] = {
            ...combinedResult[item],
            priceperchange: ((combinedResult[item][`${quarterNames[0].trim()}_priceChange`]/combinedResult[item][`${quarterNames[1].trim()}_priceChange`] - 1) * 100).toFixed(1)
          }
        } else {
          delete combinedResult[item].perchange
        }
      })
      this.setState({data: result, loading: false, combinedResult: Object.values(combinedResult), columnsCombined});      

    })

  }


  // getColumnSearchProps = dataIndex => ({
  //   filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
  //     <div style={{ padding: 8 }}>
  //       <Input
  //         ref={node => {
  //           this.searchInput = node;
  //         }}
  //         placeholder={`Search ${dataIndex}`}
  //         value={selectedKeys[0]}
  //         onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
  //         onPressEnter={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
  //         style={{ marginBottom: 8, display: 'block' }}
  //       />
  //       <Space>
  //         <Button
  //           type="primary"
  //           onClick={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
  //           icon={<SearchOutlined />}
  //           size="small"
  //           style={{ width: 90 }}
  //         >
  //           Search
  //         </Button>
  //         <Button onClick={() => this.handleReset(clearFilters)} size="small" style={{ width: 90 }}>
  //           Reset
  //         </Button>
  //         <Button
  //           type="link"
  //           size="small"
  //           onClick={() => {
  //             confirm({ closeDropdown: false });
  //             this.setState({
  //               searchText: selectedKeys[0],
  //               searchedColumn: dataIndex,
  //             });
  //           }}
  //         >
  //           Filter
  //         </Button>
  //       </Space>
  //     </div>
  //   ),
  //   filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
  //   onFilter: (value, record) =>
  //     record[dataIndex]
  //       ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
  //       : '',
  //   onFilterDropdownVisibleChange: visible => {
  //     if (visible) {
  //       setTimeout(() => this.searchInput.select(), 100);
  //     }
  //   },
  //   render: text =>
  //     this.state.searchedColumn === dataIndex ? (
  //       <Highlighter
  //         highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
  //         searchWords={[this.state.searchText]}
  //         autoEscape
  //         textToHighlight={text ? text.toString() : ''}
  //       />
  //     ) : (
  //       text
  //     ),
  // });

  // handleSearch = (selectedKeys, confirm, dataIndex) => {
  //   confirm();
  //   this.setState({
  //     searchText: selectedKeys[0],
  //     searchedColumn: dataIndex,
  //   });
  // };

  // handleReset = clearFilters => {
  //   clearFilters();
  //   this.setState({ searchText: '' });
  // };


  render() {
    const {combinedResult = [], columnsCombined} = this.state;
    let columnsC = [ {
      title: 'Symbol',
      dataIndex: 'symbol',
      sorter: (a, b) => a.symbol - b.symbol
      // ...this.getColumnSearchProps('companyName'),
    }, {
      title: 'Company Name',
      dataIndex: 'name',
    }, {
      title: 'Current Portfolio percent',
      dataIndex: 'current_percent_of_portfolio'
    }, {
      title: 'Quarter End Price',
      dataIndex: 'quarter_end_price'
    }];

    return (<div className="App">
          <input type="text" value={this.state.value} onChange={this.handleChange}></input>
          <input type="button" value="Submit" onClick={this.handleSubmit} />
      
      
        <br />
        {combinedResult.length > 0 && <div className="fund-name">Fund Name: {this.state.value.replaceAll('-', ' ').toUpperCase()}</div>}
  
      {combinedResult.length > 0 && <Table bordered pagination={false} columns={columnsCombined} dataSource={combinedResult} />}
      <br />
      <br />
      <br />
      <br />
      {this.state.data.map((item) => {
        const dataSrc = item.rows;
        return (<Table columns={columnsC} dataSource={dataSrc} />)
      })}
     
    </div>)
  }
}
export default App;
