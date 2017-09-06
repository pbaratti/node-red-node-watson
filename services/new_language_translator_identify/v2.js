/**
 * Copyright 2013,2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function (RED) {
  var LanguageTranslatorV2 = require('watson-developer-cloud/language-translator/v2'),
    cfenv = require('cfenv'),
    service = cfenv.getAppEnv().getServiceCreds(/language translator/i),
    username = null,
    password = null,
    sUsername = null,
    sPassword = null,
    endpointUrl = 'https://gateway.watsonplatform.net/language-translator/api';
//    endpointUrl = 'https://gateway-s.watsonplatform.net/language-translator/api';

  if (service) {
    sUsername = service.username;
    sPassword = service.password;
  }
  // Temporary Credentials (these are especially created for this purpose and they are on staging environment)
  //  sUsername = "e6f805f1-10f0-4f66-9d5d-bfb171d4077a";
  //  sPassword = "smuJZioqdBLx";

  RED.httpAdmin.get('/watson-language-translator-identify/vcap', function (req, res) {
    res.json(service ? {bound_service: true} : null);
  });

  function Node (config) {
    var node = this;
    RED.nodes.createNode(this, config);

    this.on('input', function (msg) {
      if (!msg.payload) {
        var message = 'Missing property: msg.payload';
        node.error(message, msg);
        return;
      }

      username = sUsername || this.credentials.username;
      password = sPassword || this.credentials.password;

      if (!username || !password) {
        var message = 'Missing Watson Language Translator service credentials';
        node.error(message, msg);
        return;
      }

      var language_translator = new LanguageTranslatorV2({
        username: username,
        password: password,
        version: 'v2',
        url: endpointUrl,
        headers: {
          "X-Watson-Learning-Opt-Out": true,
          "X-Watson-Technology-Preview": '2017-07-01'
        }
      });

      node.status({fill:'blue', shape:'dot', text:'requesting'});
      language_translator.identify({text: msg.payload}, function (err, response) {
        node.status({})
        if (err) {
          node.error(err, msg);
        } else {
          msg.languages = response.languages
          msg.lang = response.languages[0];
        }
        node.send(msg);
      });
    });
  }
  RED.nodes.registerType('new-watson-language-translator-identify', Node, {
    credentials: {
      username: {type:'text'},
      password: {type:'password'}
    }
  });
};
