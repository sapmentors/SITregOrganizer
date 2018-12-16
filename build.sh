# download the MTA archive builder
mkdir -p tmp/mta
wget -nv --output-document=tmp/mta/mta.jar --no-cookies --header "Cookie: eula_3_1_agreed=tools.hana.ondemand.com/developer-license-3_1.txt" https://tools.hana.ondemand.com/additional/mta_archive_builder-1.1.7.jar

# install the MTA archive builder
WORKSPACE=`pwd`

# install neo command line client
mkdir -p ${WORKSPACE}/tmp/neo-java-web-sdk
cd ${WORKSPACE}/tmp/neo-java-web-sdk
wget -nv 'http://central.maven.org/maven2/com/sap/cloud/neo-java-web-sdk/3.68.11/neo-java-web-sdk-3.68.11.zip'
unzip -qq -o neo-java-web-sdk-3.52.15.zip
rm neo-java-web-sdk-3.52.15.zip

# extract artifact name
cd ${WORKSPACE}
wget -nv --output-document=jq https://github.com/stedolan/jq/releases/download/jq-1.5/jq-linux64
chmod +x ./jq
mtaName=`js-yaml mta.yaml | ./jq -r '.ID'`

# replace timestamp placeholder
sed -ie "s/\${timestamp}/`date +%Y%m%d%H%M%S`/g" mta.yaml

# execute MTA build
java -jar ${WORKSPACE}/tmp/mta/mta.jar --mtar ${CI_PROJECT_NAME}.mtar --build-target=NEO build
#mkdir -p ${WORKSPACE}/dist/mta
#cp ${CI_PROJECT_NAME}.mtar dist/mta/${CI_PROJECT_NAME}-`date +%Y%m%d%H%M%S`.mtar
