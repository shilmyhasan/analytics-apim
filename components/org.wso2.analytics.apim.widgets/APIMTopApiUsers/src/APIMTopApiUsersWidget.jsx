/*
 *  Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 *
 */

import React from 'react';
import {
    defineMessages, IntlProvider, FormattedMessage,
} from 'react-intl';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Widget from '@wso2-dashboards/widget';
import APIMTopApiUsers from './APIMTopApiUsers';

const darkTheme = createMuiTheme({
    palette: {
        type: 'dark',
    },
    typography: {
        useNextVariants: true,
    },
});

const lightTheme = createMuiTheme({
    palette: {
        type: 'light',
    },
    typography: {
        useNextVariants: true,
    },
});

/**
 * Query string parameter values
 * @type {object}
 */
const createdByKeys = {
    All: 'All',
    Me: 'Me',
};

/**
 * Query string parameter
 * @type {string}
 */
const queryParamKey = 'apiUsers';

/**
 * Language
 * @type {string}
 */
const language = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage;

/**
 * Language without region code
 */
const languageWithoutRegionCode = language.toLowerCase().split(/[_-]+/)[0];

/**
 * Create React Component for APIM Top Api Users widget
 * @class APIMTopApiUsersWidget
 * @extends {Widget}
 */
class APIMTopApiUsersWidget extends Widget {
    /**
     * Creates an instance of APIMTopApiUsersWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMTopApiUsersWidget
     */
    constructor(props) {
        super(props);
        this.styles = {
            paper: {
                padding: '5%',
                border: '2px solid #4555BB',
            },
            paperWrapper: {
                margin: 'auto',
                width: '50%',
                marginTop: '20%',
            },
        };

        this.state = {
            width: this.props.width,
            height: this.props.height,
            limit: 0,
            apiCreatedBy: 'All',
            apiSelected: 'All',
            apiVersion: 'All',
            versionlist: [],
            apilist: [],
            userData: null,
            localeMessages: null,
            inProgress: true,
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.handleApiListReceived = this.handleApiListReceived.bind(this);
        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.apiCreatedHandleChange = this.apiCreatedHandleChange.bind(this);
        this.apiSelectedHandleChange = this.apiSelectedHandleChange.bind(this);
        this.apiVersionHandleChange = this.apiVersionHandleChange.bind(this);
        this.handleLimitChange = this.handleLimitChange.bind(this);
        this.assembleApiListQuery = this.assembleApiListQuery.bind(this);
        this.assembleMainQuery = this.assembleMainQuery.bind(this);
        this.loadLocale = this.loadLocale.bind(this);
        this.getUsername = this.getUsername.bind(this);
    }

    componentDidMount() {
        const { widgetID } = this.props;
        const locale = languageWithoutRegionCode || language;
        this.loadLocale(locale);
        this.getUsername();

        super.getWidgetConfiguration(widgetID)
            .then((message) => {
                this.setState({
                    providerConfig: message.data.configs.providerConfig,
                }, () => super.subscribe(this.handlePublisherParameters));
            })
            .catch((error) => {
                console.error("Error occurred when loading widget '" + widgetID + "'. " + error);
                this.setState({
                    faultyProviderConfig: true,
                });
            });
    }

    componentWillUnmount() {
        const { id } = this.props;
        super.getWidgetChannelManager().unsubscribeWidget(id);
    }

    /**
     * Load locale file.
     * @param {string} locale Locale name
     * @memberof APIMTopApiUsersWidget
     */
    loadLocale(locale) {
        Axios.get(`${window.contextPath}/public/extensions/widgets/APIMTopApiUsers/locales/${locale}.json`)
            .then((response) => {
                this.setState({ localeMessages: defineMessages(response.data) });
            })
            .catch(error => console.error(error));
    }

    /**
     * Retrieve params from publisher - DateTimeRange
     * @memberof APIMTopApiUsersWidget
     * */
    handlePublisherParameters(receivedMsg) {
        this.setState({
            timeFrom: receivedMsg.from,
            timeTo: receivedMsg.to,
            perValue: receivedMsg.granularity,
        }, this.assembleApiListQuery);
    }

    /**
     * Reset the state according to queryParam
     * @memberof APIMTopApiUsersWidget
     * */
    resetState() {
        const { apilist, versionlist } = this.state;
        const queryParam = super.getGlobalState(queryParamKey);
        let { apiCreatedBy, apiSelected, apiVersion, limit } = queryParam;
        if (!apiCreatedBy) {
            apiCreatedBy = 'All';
        }
        if (!apiSelected || (apilist && !apilist.includes(apiSelected))) {
            apiSelected = 'All';
            apiVersion = 'All';
        }
        if (!apiVersion || (versionlist && !versionlist.includes(apiVersion))) {
            apiVersion = 'All';
        }
        if (!limit || limit < 0) {
            limit = 5;
        }
        this.setState({
            apiCreatedBy, apiSelected, apiVersion, limit,
        });
        this.setQueryParam(apiCreatedBy, apiSelected, apiVersion, limit);
    }

    /**
     * Formats the siddhi query - apilistquery
     * @memberof APIMTopApiUsersWidget
     * */
    assembleApiListQuery() {
        this.resetState();
        const queryParam = super.getGlobalState(queryParamKey);
        const { apiCreatedBy } = queryParam;
        const { providerConfig, username } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'apilistquery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{createdBy}}' : apiCreatedBy !== 'All' ? 'AND CREATED_BY==\'' + username + '\'' : ''
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleApiListReceived, dataProviderConfigs);
    }

    /**
     * Get username of the logged in user
     */
    getUsername() {
        let { username } = super.getCurrentUser();
        // if email username is enabled, then super tenants will be saved with '@carbon.super' suffix, else, they
        // are saved without tenant suffix
        if (username.split('@').length === 2) {
            username = username.replace('@carbon.super', '');
        }
        this.setState({ username })
    }

    /**
     * Formats data retrieved from assembleApiListQuery
     * @param {object} message - data retrieved
     * @memberof APIMTopApiUsersWidget
     * */
    handleApiListReceived(message) {
        const { data } = message;
        const {
            apiCreatedBy, apiSelected, apiVersion, limit,
        } = this.state;
        const { id } = this.props;

        if (data) {
            const apilist = [];
            const versionlist = ['All'];

            data.forEach((dataUnit) => {
                if (!apilist.includes(dataUnit[0])) {
                    apilist.push(dataUnit[0]);
                }
                if (apiSelected === dataUnit[0]) {
                    versionlist.push(dataUnit[1]);
                }
            });
            apilist.sort();
            apilist.unshift('All');
            this.setState({ apilist, versionlist });
            this.setQueryParam(apiCreatedBy, apiSelected, apiVersion, limit);
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleMainQuery();
    }

    /**
     * Formats the siddhi query - mainquery
     * @memberof APIMTopApiUsersWidget
     * */
    assembleMainQuery() {
        this.resetState();
        const {
            timeFrom, timeTo, perValue, providerConfig, apilist,
        } = this.state;
        const queryParam = super.getGlobalState(queryParamKey);
        const { apiSelected, apiVersion, limit } = queryParam;
        const { id, widgetID: widgetName } = this.props;

        if (apilist && apilist.length > 1) {
            const dataProviderConfigs = cloneDeep(providerConfig);
            dataProviderConfigs.configs.config.queryData.queryName = 'mainquery';

            let query;
            if (apiSelected === 'All' && apiVersion === 'All') {
                let apis = apilist.slice(1).map (api => { return 'apiName==\'' + api + '\''} );
                apis = apis.join(' OR ');
                query = 'AND (' + apis + ')';
            } else if (apiSelected !== 'All' && apiVersion !== 'All') {
                query = 'AND apiName==\'' + apiSelected + '\' AND apiVersion==\'' + apiVersion + '\'';

            } else {
                query = 'AND apiName==\'' + apiSelected + '\''
            }
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{from}}': timeFrom,
                '{{to}}': timeTo,
                '{{per}}': perValue,
                '{{limit}}': limit,
                '{{querystring}}': query
            };
            super.getWidgetChannelManager()
                .subscribeWidget(id, widgetName, this.handleDataReceived, dataProviderConfigs);
        } else {
            this.setState({ inProgress: false, userData: [] });
        }
    }

    /**
     * Formats data retrieved from assembleMainQuery
     * @param {object} message - data retrieved
     * @memberof APIMTopApiUsersWidget
     * */
    handleDataReceived(message) {
        const { data } = message;
        const {
            apiCreatedBy, apiSelected, apiVersion, limit,
        } = this.state;

        if (data) {
            const userData = [];
            let counter = 0;
            data.forEach((dataUnit) => {
                counter += 1;
                userData.push({ id: counter, user: dataUnit[0], apiCalls: dataUnit[1] });
            });

            this.setState({ userData, inProgress: false });
            this.setQueryParam(apiCreatedBy, apiSelected, apiVersion, limit);
        } else {
            this.setState( { inProgress: false, userData: [] });
        }
    }

    /**
     * Updates query param values
     * @param {string} apiCreatedBy - API Created By menu option selected
     * @param {string} apiSelected - API Name menu option selected
     * @param {string} apiVersion - API Version menu option selected
     * @param {number} limit - data limitation value
     * @memberof APIMTopApiUsersWidget
     * */
    setQueryParam(apiCreatedBy, apiSelected, apiVersion, limit) {
        super.setGlobalState(queryParamKey, {
            apiCreatedBy,
            apiSelected,
            apiVersion,
            limit,
        });
    }

    /**
     * Handle Limit select Change
     * @param {Event} event - listened event
     * @memberof APIMTopApiUsersWidget
     * */
    handleLimitChange(event) {
        const { id } = this.props;
        const { apiCreatedBy, apiSelected, apiVersion } = this.state;
        const limit = (event.target.value).replace('-', '').split('.')[0];

        this.setQueryParam(apiCreatedBy, apiSelected, apiVersion, parseInt(limit, 10));
        if (limit) {
            this.setState({ inProgress: true, limit });
            super.getWidgetChannelManager().unsubscribeWidget(id);
            this.assembleMainQuery();
        } else {
            this.setState({ limit });
        }
    }

    /**
     * Handle API Created By menu select change
     * @param {Event} event - listened event
     * @memberof APIMTopApiUsersWidget
     * */
    apiCreatedHandleChange(event) {
        const { limit } = this.state;
        const { id } = this.props;

        this.setQueryParam(event.target.value, 'All', 'All', limit);
        this.setState( { inProgress: true });
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleApiListQuery();
    }

    /**
     * Handle API name menu select change
     * @param {Event} event - listened event
     * @memberof APIMTopApiUsersWidget
     * */
    apiSelectedHandleChange(event) {
        const { apiCreatedBy, limit } = this.state;
        const { id } = this.props;

        this.setQueryParam(apiCreatedBy, event.target.value, 'All', limit);
        this.setState( { inProgress: true });
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleApiListQuery();
    }

    /**
     * Handle API Version menu select change
     * @param {Event} event - listened event
     * @memberof APIMTopApiUsersWidget
     * */
    apiVersionHandleChange(event) {
        const { apiCreatedBy, apiSelected, limit } = this.state;
        const { id } = this.props;

        this.setQueryParam(apiCreatedBy, apiSelected, event.target.value, limit);
        this.setState( { inProgress: true });
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleMainQuery();
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Top Api Users widget
     * @memberof APIMTopApiUsersWidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, limit, apiCreatedBy, apiSelected, apiVersion,
            userData, apilist, versionlist, inProgress,
        } = this.state;
        const {
            loadingIcon, paper, paperWrapper, loading,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const apiUsersProps = {
            themeName, height, limit, apiCreatedBy, apiSelected, apiVersion, userData, apilist, versionlist,
            inProgress,
        };

        return (
            <IntlProvider locale={languageWithoutRegionCode} messages={localeMessages}>
                <MuiThemeProvider theme={themeName === 'dark' ? darkTheme : lightTheme}>
                    {
                        faultyProviderConfig ? (
                            <div style={paperWrapper}>
                                <Paper elevation={1} style={paper}>
                                    <Typography variant='h5' component='h3'>
                                        <FormattedMessage
                                            id='config.error.heading'
                                            defaultMessage='Configuration Error !'
                                        />
                                    </Typography>
                                    <Typography component='p'>
                                        <FormattedMessage
                                            id='config.error.body'
                                            defaultMessage={'Cannot fetch provider configuration for APIM Top '
                                            + 'Api Users widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMTopApiUsers
                                {...apiUsersProps}
                                apiCreatedHandleChange={this.apiCreatedHandleChange}
                                apiSelectedHandleChange={this.apiSelectedHandleChange}
                                apiVersionHandleChange={this.apiVersionHandleChange}
                                handleLimitChange={this.handleLimitChange}
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMTopApiUsers', APIMTopApiUsersWidget);
