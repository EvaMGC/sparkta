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

#Case 1

#clean mongoDb
mongo sparkta benchmark/src/main/js/mongoClean.js
#start spakta
nohup bin/run & > sparkta.log
sparktaPid= $!
echo  $sparktaPid
sleep  5
#send the policy
curl -X POST -H "Content-Type: application/json" --data @benchmark/src/main/resources/benchmark_caffeine_policy.json  localhost:9090/policy
sleep 30
#start the kafka feeder
java -jar benchmark/target/sparkta-benchmark-kafka-producer-0.1.0-SNAPSHOT.one-jar.jar cafeina1-10G:9092,cafeina2-10G:9092,cafeina3-10G:9092
benchPid=$!
#wait during the test
echo "wait for the test about 15 minutes"
sleep 15 m
#make report
echo "max events aggregated by second ->"
mongo sparkta benchmark/src/main/js/mongoReport.js
echo "pids" $sparktaPid

#stop all
kill -9  $sparktaPid


