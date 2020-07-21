# Install wget
apt-get install wget
# download the MTA archive builder
mkdir -p tmp/mta
wget -nv --output-document=tmp/mta/mta.jar --no-cookies --header "Cookie: eula_3_1_agreed=tools.hana.ondemand.com/developer-license-3_1.txt" https://tools.hana.ondemand.com/additional/mta_archive_builder-1.1.20.jar

# install the MTA archive builder
WORKSPACE=`pwd`

# install neo command line client
mkdir -p ${WORKSPACE}/tmp/neo-java-web-sdk
cd ${WORKSPACE}/tmp/neo-java-web-sdk
export neosdk=3.109.16
wget -nv "https://repo1.maven.org/maven2/com/sap/cloud/neo-java-web-sdk/${neosdk}/neo-java-web-sdk-${neosdk}.zip"
unzip -qq -o neo-java-web-sdk-${neosdk}.zip
rm neo-java-web-sdk-${neosdk}.zip

# extract artifact name
cd ${WORKSPACE}
wget -nv --output-document=jq https://github.com/stedolan/jq/releases/download/jq-1.6/jq-linux64
chmod +x ./jq
mtaName=`js-yaml mta.yaml | ./jq -r '.ID'`

# replace timestamp placeholder
sed -ie "s/\${timestamp}/`date +%Y%m%d%H%M%S`/g" mta.yaml
# The MTA builder doesn't run the build when "builder: npm" so we do that before invoking it
npm install
npm run build
# execute MTA build
java -jar ${WORKSPACE}/tmp/mta/mta.jar --mtar ${CI_PROJECT_NAME}.mtar --build-target=NEO build
#mkdir -p ${WORKSPACE}/dist/mta
#cp ${CI_PROJECT_NAME}.mtar dist/mta/${CI_PROJECT_NAME}-`date +%Y%m%d%H%M%S`.mtar
