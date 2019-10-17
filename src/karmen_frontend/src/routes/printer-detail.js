import React from 'react';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

import Loader from '../components/loader';
import { PrinterConnection, PrinterState } from '../components/printer-view';
import { WebcamStream } from '../components/webcam-stream';
import { PrinterEditForm } from '../components/printer-edit-form';
import { getPrinter, patchPrinter, getPrinterJobs } from '../services/karmen-backend';
import formatters from '../services/formatters';

const BASE_URL = window.env.BACKEND_BASE;

class PrintJobRow extends React.Component {
  render() {
    const { gcode_data, started } = this.props;
    if (!gcode_data) {
      return (<tr></tr>);
    }
    return (
      <tr>
        <td>
          {/* TODO replace this with a link to gcode detail on frontend*/}
          {gcode_data && gcode_data.available
            ? (<Link to={`/gcodes/${gcode_data.id}`}>{gcode_data.filename}</Link>)
            : (<span>{gcode_data.filename}</span>)
          }
        </td>
        <td>{formatters.bytes(gcode_data.size)}</td>
        <td>{dayjs(started).format('HH:mm:ss YYYY-MM-DD')}</td>
      </tr>
    );
  }
}

class PrinterDetail extends React.Component {
  state = {
    printer: null,
    jobs: [],
    jobsTable: {
      currentPage: 0,
      pages: [{
        startWith: null,
      }],
      orderBy: '-started',
    }
  }

  constructor(props) {
    super(props);
    this.loadPrinter = this.loadPrinter.bind(this);
    this.loadJobsPage = this.loadJobsPage.bind(this);
    this.changePrinter = this.changePrinter.bind(this);
  }

  loadPrinter() {
    const { match } = this.props;
    getPrinter(match.params.ip, ['job', 'status', 'webcam']).then((printer) => {
      this.setState({
        printer,
      });
    });
  }

  loadJobsPage(page, newOrderBy) {
    const { match } = this.props;
    const { jobsTable } = this.state;
    // reset pages if orderBy has changed
    if (newOrderBy !== jobsTable.orderBy) {
      jobsTable.pages = [{
        startWith: null,
      }];
      page = 0;
    }
    getPrinterJobs(jobsTable.pages[page].startWith, newOrderBy, match.params.ip).then((jobs) => {
      if (!jobs.next && jobs.items.length === 0 && page - 1 >= 0) {
        this.loadJobsPage(page - 1, newOrderBy);
        return;
      }
      let nextStartWith;
      if (jobs.next) {
        const uri = new URL(jobs.next.indexOf('http') !== 0 ? `${BASE_URL}${jobs.next}` : jobs.next)
        nextStartWith = uri.searchParams.get('start_with');
      }
      if (nextStartWith) {
        jobsTable.pages.push({
          startWith: nextStartWith,
        });
      } else {
        jobsTable.pages = [].concat(jobsTable.pages.slice(0, page + 1));
      }

      this.setState({
        jobs: jobs.items,
        jobsTable: Object.assign({}, jobsTable, {
          currentPage: page,
          orderBy: newOrderBy,
        })
      });
    });
  }

  changePrinter(newParameters) {
    const { printer } = this.state;
    return patchPrinter(printer.ip, newParameters)
      .then((r) => {
        switch(r) {
          case 204:
            this.setState({
              printer: Object.assign({}, printer, newParameters),
            });
            return {
              ok: true,
              message: 'Changes saved successfully'
            };
          case 400:
          default:
            return {
              ok: false,
              message: 'Cannot save your changes, check server logs',
            };
        }
      });
  }

  componentDidMount() {
    this.loadPrinter();
    const { jobsTable } = this.state
    this.loadJobsPage(0, jobsTable.orderBy);
  }

  render () {
    const { printer, jobs, jobsTable } = this.state;
    if (!printer) {
      return <div><Loader /></div>;
    }
    const jobsRows = jobs && jobs.map((j) => {
      return <PrintJobRow
        key={j.id}
        {...j}
        />
    });
    return (
      <div className="printer-detail standalone-page">
        <header>
          <h1 className="title">
            {printer.name}
          </h1>
        </header>
        <div>
          <div className="printer-info">
            <div >
              <PrinterConnection printer={printer} />
              <PrinterState printer={printer} />
              <div>
                <h2 className="hidden">Change printer properties</h2>
                <PrinterEditForm
                  defaults={{name: printer.name}}
                  onSubmit={this.changePrinter}
                  onCancel={() => {
                    this.props.history.push('/');
                  }}
                />
              </div>
              <div>
                <h2>Printing history</h2>
                {(!jobsRows || jobsRows.length === 0)
                  ? <p className="message-error message-block">No print jobs found!</p>
                  : (
                    <>
                      <table>
                        <thead>
                          <tr>
                            <th>Filename</th>
                            <th>Size</th>
                            <th>
                              <button className={`plain sorting-button ${jobsTable.orderBy.indexOf('started') > -1 ? 'active' : ''}`} onClick={() => {
                                let order = '+started';
                                if (jobsTable.orderBy === '+started') {
                                  order = '-started';
                                }
                                this.loadJobsPage(jobsTable.currentPage, order);
                              }}>Started</button>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {jobsRows}
                        </tbody>
                      </table>
                      <div className="table-pagination">
                        {jobsTable.currentPage > 0
                          ? <button className="plain" onClick={() => this.loadJobsPage(Math.max(0, jobsTable.currentPage - 1), jobsTable.orderBy)}>Previous</button>
                          : <span></span>}
                        {jobsTable.pages[jobsTable.currentPage + 1]
                          ? <button className="plain" onClick={() => this.loadJobsPage(jobsTable.currentPage + 1, jobsTable.orderBy)}>Next</button>
                          : <span></span>}
                      </div>
                    </>
                  )}
              </div>
            </div>
            <WebcamStream {...printer.webcam} />
          </div>
        </div>
      </div>
    );
  }
}

export default PrinterDetail;