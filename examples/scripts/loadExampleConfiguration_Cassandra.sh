#!/usr/bin/env bash
#
# Copyright (C) 2014 Stratio (http://stratio.com)
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#


FRAGMENT=$(curl -sX GET -H "Content-Type: application/json" localhost:9090/fragment/input/name/websocket | jq '.id')

if [ "$FRAGMENT" == "null" ]; then
  INPUT=$(curl -sX POST -H "Content-Type: application/json" --data @../policies/fragments/WebSocketFragment.json localhost:9090/fragment | jq '.id' | sed -e "s/\"//g")
else
  INPUT = $(echo "$FRAGMENT" | tr -d '"')
fi
echo $INPUT

OUTPUT=$(curl -sX POST -H "Content-Type: application/json" --data @../policies/fragments/CassandraFragment.json localhost:9090/fragment | jq '.id' | sed -e "s/\"//g")
echo $OUTPUT

cat ../policies/fragments/IWebSocket-OCassandra.json|sed -e "s/_input_id_/$INPUT/g"|sed -e "s/_output_id_/$OUTPUT/g" >temp.json

POL=$(curl -sX POST -H "Content-Type: application/json" --data @./temp.json  localhost:9090/policy |jq '.id'| sed -e "s/\"//g")
echo $POL