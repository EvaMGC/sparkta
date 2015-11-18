/**
 * Copyright (C) 2014 Stratio (http://stratio.com)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.stratio.examples.twittertorabbit;

import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import org.codehaus.jackson.map.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import twitter4j.*;

import java.io.IOException;

public class TwitterToRabbitMQSimple extends TwitterToRabbitMQ {

    private final static Logger LOG = LoggerFactory.getLogger(TwitterToRabbitMQSimple.class);

    /**
     * Main entry of this application.
     *
     * @param args arguments doesn't take effect with this example
     */
    public static void main(String[] args) {

        ConnectionFactory factory = new ConnectionFactory();
        try {
            Connection conn = factory.newConnection();
            channel = conn.createChannel();
        } catch (IOException e) {
            LOG.error("Cannot create RabbitMQ channel", e);
        }

        mapper = new ObjectMapper();

        TwitterStream twitterStream = new TwitterStreamFactory().getInstance();
        StatusListener listener = new StatusListener() {

            public void onStatus(Status status) {
                try {
                    channel.basicPublish("", "test", null, mapper.writeValueAsBytes(status));
                } catch (IOException e) {
                    LOG.error("Cannot publish status: " + status, e);
                }
            }

            public void onDeletionNotice(StatusDeletionNotice statusDeletionNotice) {
            }

            public void onTrackLimitationNotice(int numberOfLimitedStatuses) {
            }

            public void onScrubGeo(long userId, long upToStatusId) {
            }

            public void onStallWarning(StallWarning warning) {
            }

            public void onException(Exception ex) {
                LOG.error("Error listening on twitter stream", ex);
            }
        };
        twitterStream.addListener(listener);
        twitterStream.sample();
    }

}
