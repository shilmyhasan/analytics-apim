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
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import PlayCircleFilled from '@material-ui/icons/PlayCircleFilled';
import AppIcon from './AppIcon';

/**
 * React Component for APIM App Created widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the APIM App Created Count widget body
 */
export default function APIMAppCreated(props) {
    const { themeName, totalCount, weekCount } = props;
    const styles = {
        headingWrapper: {
            height: '10%',
            margin: 'auto',
            paddingTop: '15px',
            width: '90%',
        },
        cIconWrapper: {
            float: 'left',
            width: '40%',
            height: '62%',
        },
        cIcon: {
            display: 'block',
            margin: 'auto',
            marginTop: '25%',
        },
        dataWrapper: {
            float: 'left',
            width: '60%',
            height: '50%',
            paddingTop: '8%',
        },
        weekCount: {
            margin: 0,
            marginTop: '5%',
            color: 'rgb(163, 187, 230)',
            letterSpacing: 1,
            fontSize: '80%',
        },
        typeText: {
            textAlign: 'left',
            fontWeight: 'normal',
            margin: 0,
            display: 'inline',
            marginLeft: '3%',
            letterSpacing: 1.5,
            fontSize: 'small',
        },
        icon: {
            position: 'absolute',
            bottom: '13%',
            right: '8%',
        },
    };
    return (
        <div
            style={{
                width: '90%',
                height: '85%',
                margin: '5% 5%',
                background: themeName === 'dark'
                    ? 'linear-gradient(to right, rgb(3, 8, 68) 0%, rgb(47, 93, 197) 46%, rgb(42, 49, 101) 100%)'
                    : '#fff',
            }}
        >
            <div style={styles.headingWrapper}>
                <h3
                    style={{
                        borderBottom: themeName === 'dark' ? '1.5px solid #fff' : '2px solid #040f96',
                        paddingBottom: '10px',
                        margin: 'auto',
                        textAlign: 'left',
                        fontWeight: 'normal',
                        letterSpacing: 1.5,
                    }}
                >
                    <FormattedMessage id='widget.heading' defaultMessage='TOTAL APP COUNT' />
                </h3>
            </div>
            <div style={styles.cIconWrapper}>
                <AppIcon
                    strokeColor={themeName === 'dark' ? '#fff' : '#040f96'}
                    width='50%'
                    height='50%'
                    style={styles.cIcon}
                />
            </div>
            <div style={styles.dataWrapper}>
                <h1
                    style={{
                        margin: 'auto',
                        textAlign: 'center',
                        fontSize: '300%',
                        display: 'inline',
                        color: themeName === 'dark' ? '#fff' : '#040f96',
                    }}
                >
                    {totalCount}
                </h1>
                <h3 style={styles.typeText}>
                    {totalCount === '01' ? 'APP' : 'APPS'}
                </h3>
                <p style={styles.weekCount}>
                    [
                    {' '}
                    {weekCount}
                    {' '}
                    {weekCount === '01' ? 'APP' : 'APPS'}
                    {' '}
                    <FormattedMessage id='within.week.text' defaultMessage='WITHIN LAST WEEK ' />
                    ]
                </p>
            </div>
            {/*todo make routing configurable from widgetconf*/}
            {/*<button*/}
                {/*type='button'*/}
                {/*style={{*/}
                    {/*display: 'block',*/}
                    {/*width: '100%',*/}
                    {/*height: '21%',*/}
                    {/*background: themeName === 'dark'*/}
                        {/*? 'linear-gradient(to right, rgba(37, 38, 41, 0.75) 0%, rgba(252, 252, 252, 0) 100%)'*/}
                        {/*: '#fff',*/}
                    {/*border: 'none',*/}
                    {/*borderTop: themeName === 'dark' ? 'none' : '1.5px solid #000',*/}
                    {/*color: themeName === 'dark' ? '#fff' : '#000',*/}
                    {/*textAlign: 'left',*/}
                    {/*padding: '0 5%',*/}
                    {/*fontSize: '90%',*/}
                    {/*letterSpacing: 1,*/}
                    {/*cursor: 'pointer',*/}
                {/*}}*/}
                {/*onClick={() => {*/}
                    {/*window.location.href = './api-app-statistics';*/}
                {/*}}*/}
            {/*>*/}
                {/*<FormattedMessage id='overtime.btn.text' defaultMessage='Overtime Analysis' />*/}
                {/*<PlayCircleFilled style={styles.icon} />*/}
            {/*</button>*/}
        </div>
    );
}

APIMAppCreated.propTypes = {
    themeName: PropTypes.string.isRequired,
    totalCount: PropTypes.string.isRequired,
    weekCount: PropTypes.string.isRequired,
};
