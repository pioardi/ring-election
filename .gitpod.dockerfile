USER root
# Install custom tools, runtime, etc.	# Install custom tools, runtime, etc.
RUN apt-get update && apt-get install -y \
                docker-ce \
                docker-cli \
                containerd.io \
    && apt-get clean && rm -rf /var/cache/apt/* && rm -rf /var/lib/apt/lists/* && rm -rf /tmp/*	    && apt-get clean && rm -rf /var/cache/apt/* && rm -rf /var/lib/apt/lists/* && rm -rf /tmp/*


 USER gitpod	USER gitpod




 # Give back control	# Give back control
#USER root	USER root
