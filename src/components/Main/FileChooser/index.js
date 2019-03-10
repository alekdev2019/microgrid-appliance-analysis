import React, { Component } from 'react'
import { observer, inject } from 'mobx-react'
import _ from 'lodash'
import {
  Dropdown,
  Header,
  Grid,
  Popup,
  Form,
  Table,
  Checkbox,
  Icon,
  Loader,
  Radio,
  Input,
} from 'semantic-ui-react'

const ApplianceSelectionTrigger = props => {
  const { loading } = props
  return (
    <div {..._.omit(props, ['loading'])} style={{ cursor: 'pointer' }}>
      TODO show selected appliances here
      {loading ? (
        <Loader active inline size="tiny" style={{ paddingLeft: '26px' }} />
      ) : (
        <Icon name="dropdown" style={{ paddingLeft: '12px' }} />
      )}
    </div>
  )
}

const ApplianceSelectionTable = inject('store')(
  observer(({ store }) => {
    const { appliances } = store
    return (
      <Table basic="very" compact>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Enable</Table.HeaderCell>
            <Table.HeaderCell style={{ width: '200px' }}>Label</Table.HeaderCell>
            <Table.HeaderCell style={{ width: '300px' }}>Description</Table.HeaderCell>
            <Table.HeaderCell style={{ width: '120px' }}>Cost</Table.HeaderCell>
            <Table.HeaderCell collapsing>Cost Assignment</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {_.map(appliances, appliance => {
            const {
              fileInfo,
              fileLabel,
              fileDescription,
              capexTempValue,
              capexInputError,
              enabled,
              toggleAppliance,
              handleCapexChange,
            } = appliance
            return (
              <Table.Row key={fileInfo.id}>
                <Table.Cell collapsing>
                  <Checkbox toggle checked={enabled} onChange={toggleAppliance} />
                </Table.Cell>
                <Table.Cell>{fileLabel}</Table.Cell>
                <Table.Cell>{fileDescription}</Table.Cell>
                <Table.Cell>
                  <Input
                    fluid
                    value={capexTempValue}
                    onChange={handleCapexChange}
                    error={capexInputError}
                    size="small"
                    label={{ basic: true, content: '$' }}
                    labelPosition="left"
                  />
                </Table.Cell>
                <Table.Cell>
                  <Form style={{ marginTop: '7px', marginBottom: '7px' }}>
                    <Form.Field style={{ marginBottom: 0 }}>
                      <Radio
                        label="Grid Owner"
                        name="radioGroup"
                        value="this"
                        checked={true}
                        style={{ marginBottom: '3px' }}
                        // onChange={this.handleChange}
                      />
                    </Form.Field>
                    <Form.Field>
                      <Radio
                        label="Appliance Owner"
                        name="radioGroup"
                        value="that"
                        checked={false}
                        // onChange={this.handleChange}
                      />
                    </Form.Field>
                  </Form>
                </Table.Cell>
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table>
    )
  })
)

class FileChoosers extends Component {
  setActiveGridFile = (event, data) => {
    event.preventDefault()
    this.props.store.setActiveGridFile(data.value)
  }

  render() {
    const {
      activeGrid,
      availableGrids,
      activeGridIsLoading,
      appliancesAreLoading,
      ancillaryEquipment,
    } = this.props.store
    const { enabledEquipmentList } = ancillaryEquipment
    return (
      <Grid columns="equal" padded>
        <Grid.Row>
          <Grid.Column>
            <Header as="h5" style={{ marginBottom: 4 }}>
              Select Grid File:
            </Header>
            <Dropdown text={activeGrid.fileLabel} loading={activeGridIsLoading}>
              <Dropdown.Menu>
                {_.map(availableGrids, grid => (
                  <Dropdown.Item
                    text={grid.fileLabel}
                    key={grid.fileInfo.id}
                    description={grid.fileDescription}
                    value={grid.fileInfo.id}
                    active={grid.fileInfo.id === activeGrid.fileInfo.id}
                    onClick={this.setActiveGridFile}
                    // icon="check" // If currently active (or bold)
                  />
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </Grid.Column>
          <Grid.Column>
            <Header as="h5" style={{ marginBottom: 4 }}>
              Select Appliance Usage Profile:
            </Header>
            <Popup
              flowing
              trigger={<ApplianceSelectionTrigger loading={appliancesAreLoading} />}
              content={<ApplianceSelectionTable />}
              on="click"
              position="bottom center"
            />
          </Grid.Column>
          <Grid.Column>
            <Header as="h5" style={{ marginBottom: 4 }}>
              Selected Ancillary Equipment
            </Header>
            {!_.isEmpty(enabledEquipmentList) && enabledEquipmentList.join(', ')}
          </Grid.Column>
        </Grid.Row>
      </Grid>
    )
  }
}

export default inject('store')(observer(FileChoosers))
