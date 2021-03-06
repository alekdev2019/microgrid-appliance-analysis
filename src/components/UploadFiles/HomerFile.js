import * as React from 'react'
import _ from 'lodash'
import { observer, inject } from 'mobx-react'
import { Grid, Header, Segment, Button, Icon, Loader, Label, Message } from 'semantic-ui-react'
import FileButton from '../../components/Elements/FileButton'
import BatteryChargeTable from '../../components/Elements/BatteryChargeTable'
import HomerFormFields from './HomerFormFields'
import BatteryModel from './BatteryModel'

const FileUploadErrors = ({ fileErrors }) => {
  if (_.isEmpty(fileErrors)) {
    return 'None Found'
  }
  return (
    <div>
      {_.map(fileErrors, error => (
        <div key={error}>{error}</div>
      ))}
    </div>
  )
}

const StagedFileHeader = inject('store')(
  observer(({ store, viewedGrid }) => {
    const { fileIsSelected, isAnalyzingFile, handleGridFileUpload, batteryIsTrained } = viewedGrid
    const { cancelStagedGrid, saveStagedGrid } = store
    return (
      <div>
        <Header as="h3" attached="top" style={{ paddingBottom: '18px' }}>
          {!fileIsSelected && (
            <FileButton
              content="Upload & Analyze HOMER File"
              icon="upload"
              size="tiny"
              color="blue"
              floated="right"
              onSelect={handleGridFileUpload}
              basic
            />
          )}
          {fileIsSelected && (
            <Button
              content="Save HOMER File"
              icon="save"
              size="tiny"
              color="blue"
              floated="right"
              disabled={!batteryIsTrained}
              onClick={saveStagedGrid}
              basic
            />
          )}
          {fileIsSelected && (
            <Button floated="right" basic size="tiny" onClick={cancelStagedGrid}>
              <Icon name="cancel" />
              Cancel
            </Button>
          )}
          Add HOMER File
          {isAnalyzingFile && (
            <Header.Subheader style={{ display: 'inline-block', marginLeft: '1rem' }}>
              Analyzing File <Loader active inline size="tiny" />
            </Header.Subheader>
          )}
        </Header>
      </div>
    )
  })
)

class HomerFile extends React.Component {
  handleActivateGrid = () => {
    const viewedGridId = _.get(this, 'props.viewedGrid.fileInfo.id')
    this.props.store.setActiveGridFile(viewedGridId)
  }

  render() {
    const { viewedGrid } = this.props
    if (_.isEmpty(viewedGrid)) {
      return <h3>Empty Viewed Grid</h3> // log this
    }
    const { viewedGridIsStaged } = this.props.store
    const {
      fileLabel,
      fileDescription,
      showAnalyzedResults,
      fileErrors,
      fileWarnings,
      isActiveGrid,
    } = viewedGrid
    return (
      <div>
        {viewedGridIsStaged && <StagedFileHeader viewedGrid={viewedGrid} />}
        {!viewedGridIsStaged && (
          <Header as="h3" attached="top">
            {fileLabel}
            {!isActiveGrid && (
              <Button floated="right" basic size="tiny" onClick={this.handleActivateGrid}>
                Make Grid Active
              </Button>
            )}
            <Header.Subheader>{fileDescription}</Header.Subheader>
          </Header>
        )}
        {!showAnalyzedResults && (
          <Message warning>
            <p>
              This app is in beta. You may have to re-upload files in the future when we update this
              app. Make sure to keep copies of your files.
            </p>
          </Message>
        )}
        {showAnalyzedResults && (
          <Segment attached>
            <Grid>
              <Grid.Row>
                <Grid.Column width={8}>
                  <HomerFormFields grid={viewedGrid} />
                </Grid.Column>
                <Grid.Column width={8}>
                  <BatteryChargeTable grid={viewedGrid} />
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column width={4}>
                  <Label color={_.isEmpty(fileErrors) ? 'grey' : 'red'} basic>
                    File Upload Errors
                  </Label>
                </Grid.Column>
                <Grid.Column width={12}>
                  <FileUploadErrors fileErrors={fileErrors} />
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column width={4}>
                  <Label color={_.isEmpty(fileWarnings) ? 'grey' : 'orange'} basic>
                    File Upload Warnings
                  </Label>
                </Grid.Column>
                <Grid.Column width={12}>
                  <FileUploadErrors fileErrors={fileWarnings} />
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column>
                  <BatteryModel grid={viewedGrid} />
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </Segment>
        )}
      </div>
    )
  }
}

export default inject('store')(observer(HomerFile))
