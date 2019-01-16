import * as React from 'react'
import { observer, inject } from 'mobx-react'
import _ from 'lodash'
import { List, Checkbox, Input, Popup, Icon } from 'semantic-ui-react'
import { columnHeaderByTableType } from '../../../utils/columnHeaders'
import { tableColorsByKey } from '../../../utils/constants'

const selectorBoxStyles = {
  // border: '1px solid rgba(34, 36, 38, 0.15)',
  cursor: 'pointer',
  float: 'right',
  width: '100%',
}

const SelectedColumnIndicator = ({ column, excludedColumns, columnWidth }) => {
  const tableType = excludedColumns.has(column) ? 'excluded' : columnHeaderByTableType[column]
  return (
    <div
      style={{
        display: 'inline-block',
        width: columnWidth,
        height: '20px',
        margin: 0,
        padding: 0,
        backgroundColor: tableColorsByKey[tableType],
      }}
    />
  )
}

const ColumnSelectorPopup = ({ columns, excludedColumns, ...rest }) => {
  const columnWidth = `${(1 / _.size(columns)) * 100}%`
  return (
    <div {...rest} style={selectorBoxStyles}>
      <h5 style={{ margin: '10px 0 0 0' }}>
        Select Columns <small>100% columns showing</small>
      </h5>
      <div>
        {_.map(columns, column => (
          <SelectedColumnIndicator
            column={column}
            excludedColumns={excludedColumns}
            columnWidth={columnWidth}
            key={column}
          />
        ))}
      </div>
    </div>
  )
}

class ColumnSelector extends React.Component {
  state = {
    searchString: '',
  }

  handleSearchChange = (e, { value }) => {
    e.preventDefault()
    this.setState({ searchString: value })
  }

  handleSearchClear = (e, data) => {
    e.preventDefault()
    this.setState({ searchString: '' })
  }

  handleCheckChange = (e, data) => {
    e.preventDefault()
    this.props.store.setExcludedTableColumns(data)
  }

  render() {
    const { searchString } = this.state
    const { headers, store } = this.props
    const { excludedTableColumns } = store
    const filteredHeaders = _.filter(headers, header => {
      return _.includes(header.toLowerCase(), searchString)
    })
    return (
      <Popup
        trigger={<ColumnSelectorPopup columns={headers} excludedColumns={excludedTableColumns} />}
        basic
        flowing
        position="bottom left"
        verticalOffset={-10}
        on="click">
        <Popup.Header>
          <Input
            icon={<Icon name="times" onClick={this.handleSearchClear} circular link />}
            placeholder="Search header titles"
            value={searchString}
            onChange={this.handleSearchChange}
          />
        </Popup.Header>
        <List selection verticalAlign="middle">
          {_.map(filteredHeaders, header => {
            return (
              <List.Item key={header}>
                <Checkbox
                  label={<label>{header}</label>}
                  onChange={this.handleCheckChange}
                  checked={!excludedTableColumns.has(header)}
                />
              </List.Item>
            )
          })}
        </List>
      </Popup>
    )
  }
}

export default inject('store')(observer(ColumnSelector))