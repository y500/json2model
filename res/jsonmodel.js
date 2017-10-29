
var jsonmodel = {

    classHeaderString : '',
    classImplementString : '',
    javaBinString : '',
    javaSubBin : '',
    swiftString : '',
    swiftSubString : '',


    uppercaseFirstLetter : function (string) {
        var newStr = string.replace(/\b[a-z]/g, function(letter) {
            return letter.toUpperCase();
        })
        return newStr;
    },
    lowercaseFirstLetter : function(string) {
        var newStr = string.replace(/\b[a-z]/g, function(letter) {
            return letter.toLowerCase();
        });
        return newStr;
    },
    isArray : function(object) {
        if (object instanceof Object) {
            return object.constructor.prototype.hasOwnProperty('push');
        }
        return false;
    },

    isMap : function(object) {
        if (object instanceof Object) {
            return !object.constructor.prototype.hasOwnProperty('push');
        }
        return false;
    },

    clearLastResult : function() {
        jsonmodel.classHeaderString ='';
        jsonmodel.classImplementString='';
        jsonmodel.javaBinString='';
        jsonmodel.javaSubBin='';
        jsonmodel.swiftString='';
        jsonmodel.swiftSubString='';
    },

    preProcess : function () {
        var orignText = editor_json.getValue().trim();
        try {
            var result = jsonlint.parse(orignText);
            if (result) {
                document.getElementById("result-container").setAttribute("class", "shown");
                document.getElementById("result").innerHTML = "JSON is valid!";
                document.getElementById("result").setAttribute("class", "success");

                var newText = JSON.stringify(result, null, "  ");
                editor_json.setValue(newText);
                return true;
            }
        } catch(e) {
            document.getElementById("result-container").setAttribute("class", "shown");
            document.getElementById("result").innerHTML = e;
            document.getElementById("result").className = "error";
            return false;
        }
    },

    objectcModel : function () {
        function interface(className, content) {
            return "@interface "+className+" :NSObject\n"+content+"\n@end\n";
        }
        function implement(className) {
            return "@implement "+className+"\n@end\n";
        }

        function assignProperty(propertyType, propertyName) {
            return "@property (nonatomic , assign) "+propertyType+"              "+propertyName+";\n"
        }

        function strongProperty(propertyType, propertyName) {
            return "@property (nonatomic , strong) "+propertyType+"              * "+propertyName+";\n"
        }

        function copyProperty(propertyType, propertyName) {
            return "@property (nonatomic , copy) "+propertyType+"              * "+propertyName+";\n"
        }

        function generateFile(json, fileName) {
            jsonmodel.clearLastResult();
            
            if (fileName.length == 0) {
                fileName = 'ModelName';
            }

            var propertyContent = generateContent(json, fileName);

            if (jsonmodel.classHeaderString.length > 0) {
                jsonmodel.classHeaderString = jsonmodel.classHeaderString+"\r\n\r\n"+interface(fileName, propertyContent);
            }else {
                jsonmodel.classHeaderString = interface(fileName, propertyContent);
            }

            if (jsonmodel.classImplementString.length > 0) {
                jsonmodel.classImplementString = jsonmodel.classImplementString+"\r\n\r\n"+implement(fileName);
            }else {
                jsonmodel.classImplementString = implement(fileName);
            }

            var headerCode = document.createElement("pre");
            headerCode.setAttribute("id", "headCode");
            headerCode.setAttribute("class", "model-result prettyprint lang-m");
            headerCode.append(jsonmodel.classHeaderString);

            document.getElementById('precode').appendChild(headerCode)


            var implementCode = document.createElement("pre");
            implementCode.setAttribute("id", "implementCode");
            implementCode.setAttribute("class", "model-result prettyprint lang-m");
            implementCode.append(jsonmodel.classImplementString);

            document.getElementById('precode').appendChild(implementCode)

            prettyPrint();
            //document.getElementById('model').value=classHeaderString+classImplementString;
        }

        function generateContent(object, key) {
            var propertyString = '';

            if (jsonmodel.isArray(object)) {
                if (object.length > 0) {
                    var array = object;
                    if (array.length > 0) {
                        var tmpobject = array[0];
                        for (var i = array.length - 1; i >= 0; i--) {
                            var subObject = array[i];
                            if (jsonmodel.isArray(subObject)) {
                                if (subObject.length > tmpobject.length) {
                                    tmpobject = subObject;
                                }
                            }else if (jsonmodel.isMap(subObject)) {
                                if (Object.keys(subObject).length > Object.keys(tmpobject).length) {
                                    tmpobject = subObject;
                                }
                            }
                        }
                        propertyString = propertyString+generateContent(tmpobject, key);
                    }
                }
            }else if (jsonmodel.isMap(object)) {
                for (var subKey in object) {
                    subObject = object[subKey];
                    var subClassName = jsonmodel.uppercaseFirstLetter(subKey);
                    var subPropertyName = jsonmodel.lowercaseFirstLetter(subKey);

                    if (jsonmodel.isArray(subObject)) {

                        var firstObject;
                        var subPropertyString;

                        if (subObject.length > 0) {
                            firstObject = subObject[0];
                        }

                        if (typeof(firstObject) === 'string') {
                            propertyString = propertyString + strongProperty("NSArray <NSString *>", subPropertyName);
                        }else if (typeof(firstObject) === 'number' || typeof(firstObject) === 'boolean') {
                            propertyString = propertyString + strongProperty("NSArray <NSNumber *>", subPropertyName);
                        }else if (typeof(firstObject) === 'object') {
                            var subModelItemName = subClassName+"Item";
                            propertyString = propertyString + strongProperty("NSArray <"+subModelItemName+" *>", subPropertyName);
                            subPropertyString = generateContent(subObject, subKey);
                            if (jsonmodel.classHeaderString.length > 0) {
                                jsonmodel.classHeaderString = jsonmodel.classHeaderString + "\r\n\r\n" + interface(subModelItemName, subPropertyString);
                            }else {
                                jsonmodel.classHeaderString = interface(subModelItemName, subPropertyString);
                            }
                            if (jsonmodel.classImplementString.length > 0) {
                                jsonmodel.classImplementString = jsonmodel.classImplementString + "\r\n\r\n" + implement(subModelItemName);
                            }else {
                                jsonmodel.classImplementString = implement(subModelItemName);
                            }
                        }


                    }else if (jsonmodel.isMap(subObject)) {
                        var subPropertyString = generateContent(subObject, subKey);

                        propertyString = propertyString + strongProperty(subClassName, subPropertyName);

                        if (jsonmodel.classHeaderString.length > 0) {
                            jsonmodel.classHeaderString = jsonmodel.classHeaderString + "\r\n\r\n" + interface(subClassName, subPropertyString);
                        }else {
                            jsonmodel.classHeaderString = interface(subClassName, subPropertyString);
                        }

                        if (jsonmodel.classImplementString.length > 0) {
                            jsonmodel.classImplementString = jsonmodel.classImplementString + "\r\n\r\n" + implement(subClassName);
                        }else {
                            jsonmodel.classImplementString = implement(subClassName);
                        }

                    }else if (typeof(subObject) === 'string') {
                        propertyString = propertyString + copyProperty("NSString", subPropertyName);
                    }else if (typeof(subObject) === 'number') {
                        var str = subObject.toString();
                        if (str.indexOf('.') >= 0) {
                            propertyString = propertyString + assignProperty("CGFloat", subPropertyName);
                        }else {
                            propertyString = propertyString + assignProperty("NSInteger", subPropertyName);
                        }

                    }else if (typeof(subObject) === 'boolean') {
                        propertyString = propertyString + assignProperty("BOOL", subPropertyName);
                    }

                }
            }else {
                alert("key = "+key)
            }

            return propertyString;
        }

        this.clearContent();
        this.preProcess();

        var fileName = document.getElementById("fileName").value.trim();
        var jsonStr = editor_json.getValue();
        var obj =  eval('(' + jsonStr + ')');
        generateFile(obj, jsonmodel.uppercaseFirstLetter(fileName));

    },

    javaBean : function () {
        function javaClassHeader(className) {
            return "public static class "+className+"    {\r\n";
        }

        function javaString(propertyName) {
            return "    public String    "+propertyName+";\r\n";
        }

        function javaInt(propertyName) {
            return "    public int    "+propertyName+";\r\n";
        }

        function javaBoolean(propertyName) {
            return "    public boolean    "+propertyName+";\r\n";
        }

        function javaDouble(propertyName) {
            return "    public double    "+propertyName+";\r\n";
        }

        function javaList(propertyName, subPropertyName) {
            return "    public List<"+subPropertyName+"> "+propertyName+";\r\n";
        }

        function javaClassTail() {
            return "}\r\n";
        }

        function generateJavaFile(json, fileName) {
            jsonmodel.clearLastResult();

            if (fileName.length == 0) {
                fileName = 'ModelName';
            }

            var propertyContent = generateJavaContent(json, fileName);

            jsonmodel.javaBinString = javaClassHeader(fileName)+propertyContent+javaClassTail();

            var javaResult = jsonmodel.javaBinString;
            if (jsonmodel.javaSubBin.length > 0) {
                javaResult = jsonmodel.javaSubBin + "\r\n" + jsonmodel.javaBinString;
            }

            var implementCode = document.createElement("pre");
            implementCode.setAttribute("id", "implementCode");
            implementCode.setAttribute("class", "model-result prettyprint lang-java");
            implementCode.append(javaResult);

            document.getElementById('precode').appendChild(implementCode)

            prettyPrint();
            //document.getElementById('model').value=classHeaderString+classImplementString;
        }

        function generateJavaContent(object, key) {
            var javaPropertyString = '';

            if (jsonmodel.isArray(object)) {
                if (object.length > 0) {
                    var array = object;
                    if (array.length > 0) {
                        var tmpobject = array[0];
                        for (var i = array.length - 1; i >= 0; i--) {
                            var subObject = array[i];
                            if (jsonmodel.isArray(subObject)) {
                                if (subObject.length > tmpobject.length) {
                                    tmpobject = subObject;
                                }
                            }else if (jsonmodel.isMap(subObject)) {
                                if (Object.keys(subObject).length > Object.keys(tmpobject).length) {
                                    tmpobject = subObject;
                                }
                            }
                        }
                        javaPropertyString = javaPropertyString+generateJavaContent(tmpobject, key);
                    }
                }
            }else if (jsonmodel.isMap(object)) {
                for (var subKey in object) {
                    subObject = object[subKey];
                    var subClassName = jsonmodel.uppercaseFirstLetter(subKey);
                    var subPropertyName = jsonmodel.lowercaseFirstLetter(subKey);

                    if (jsonmodel.isArray(subObject)) {

                        var firstObject;
                        var subJavaPropertyString;

                        if (subObject.length > 0) {
                            firstObject = subObject[0];
                        }

                        if (typeof(firstObject) === 'string') {
                            javaPropertyString = javaPropertyString + javaString(subPropertyName);
                        }else if (typeof(firstObject) === 'number' || typeof(firstObject) === 'boolean') {
                            javaPropertyString = javaPropertyString + javaInt(subPropertyName);
                        }else if (typeof(firstObject) === 'object') {
                            var subBinName = subClassName+"Item";
                            javaPropertyString = javaPropertyString + javaList(subPropertyName, subBinName);

                            var subJavaString = javaClassHeader(subBinName) + generateJavaContent(subObject, subKey) + javaClassTail();

                            if (jsonmodel.javaSubBin.length > 0) {
                                jsonmodel.javaSubBin = jsonmodel.javaSubBin + "\r\n" + subJavaString;
                            }else {
                                jsonmodel.javaSubBin = subJavaString;
                            }

                        }

                    }else if (jsonmodel.isMap(subObject)) {

                        var subJavaString = javaClassHeader(jsonmodel.uppercaseFirstLetter(subPropertyName)) + generateJavaContent(subObject, subKey) + javaClassTail();

                        if (jsonmodel.javaSubBin.length > 0) {
                            jsonmodel.javaSubBin = jsonmodel.javaSubBin + "\r\n" + subJavaString;
                        }else {
                            jsonmodel.javaSubBin = subJavaString;
                        }

                    }else if (typeof(subObject) === 'string') {
                        javaPropertyString = javaPropertyString + javaString(subPropertyName);
                    }else if (typeof(subObject) === 'number') {
                        var str = subObject.toString();
                        if (str.indexOf('.') >= 0) {
                            javaPropertyString = javaPropertyString + javaDouble(subPropertyName);
                        }else {
                            javaPropertyString = javaPropertyString + javaInt(subPropertyName);
                        }
                    }else if (typeof(subObject) === 'boolean') {
                        javaPropertyString = javaPropertyString + javaBoolean(subPropertyName);
                    }

                }
            }else {
                alert("key = "+key)
            }

            return javaPropertyString;
        }

        this.clearContent();
        this.preProcess();

        var fileName = document.getElementById("fileName").value.trim();
        var jsonStr = editor_json.getValue();
        var obj =  eval('(' + jsonStr + ')');
        generateJavaFile(obj, jsonmodel.uppercaseFirstLetter(fileName));
    },

    swiftModel : function () {
        function swiftClassHeader(className) {
            return "class "+className+"    : NSObject {\r\n";
        }

        function swiftStringProperty(propertyName) {
            return "    var "+propertyName+": String!\r\n";
        }

        function swiftInt(propertyName) {
            return "    var "+propertyName+": Int = 0\r\n";
        }

        function swiftFloat(propertyName) {
            return "    var "+propertyName+": CGFloat = 0.0\r\n";
        }

        function swiftBool(propertyName) {
            return "    var "+propertyName+": Bool = false\r\n";
        }

        function swiftList(propertyName, subPropertyName) {
            return "    var "+propertyName+": ["+propertyName+"]!\r\n";
        }

        function swiftClassTail() {
            return "}\r\n";
        }

        function generateSwiftFile(json, fileName) {
            jsonmodel.clearLastResult();

            if (fileName.length == 0) {
                fileName = 'ModelName';
            }

            var propertyContent = generateSwiftContent(json, fileName);

            jsonmodel.swiftString = swiftClassHeader(fileName)+propertyContent+swiftClassTail();

            var swiftResult = jsonmodel.swiftString;
            if (jsonmodel.swiftSubString.length > 0) {
                swiftResult = jsonmodel.swiftSubString + "\r\n" + jsonmodel.swiftString;
            }

            var implementCode = document.createElement("pre");
            implementCode.setAttribute("id", "implementCode");
            implementCode.setAttribute("class", "model-result prettyprint lang-swift");
            implementCode.append(swiftResult);

            document.getElementById('precode').appendChild(implementCode)

            prettyPrint();
            //document.getElementById('model').value=classHeaderString+classImplementString;
        }

        function generateSwiftContent(object, key) {
            var swiftPropertyString = '';

            if (jsonmodel.isArray(object)) {
                if (object.length > 0) {
                    var array = object;
                    if (array.length > 0) {
                        var tmpobject = array[0];
                        for (var i = array.length - 1; i >= 0; i--) {
                            var subObject = array[i];
                            if (jsonmodel.isArray(subObject)) {
                                if (subObject.length > tmpobject.length) {
                                    tmpobject = subObject;
                                }
                            }else if (jsonmodel.isMap(subObject)) {
                                if (Object.keys(subObject).length > Object.keys(tmpobject).length) {
                                    tmpobject = subObject;
                                }
                            }
                        }
                        swiftPropertyString = swiftPropertyString+generateSwiftContent(tmpobject, key);
                    }
                }
            }else if (jsonmodel.isMap(object)) {
                for (var subKey in object) {
                    subObject = object[subKey];
                    var subClassName = jsonmodel.uppercaseFirstLetter(subKey);
                    var subPropertyName = jsonmodel.lowercaseFirstLetter(subKey);

                    if (jsonmodel.isArray(subObject)) {

                        var firstObject;
                        var subSwiftPropertyString;

                        if (subObject.length > 0) {
                            firstObject = subObject[0];
                        }

                        if (typeof(firstObject) === 'string') {
                            swiftPropertyString = swiftPropertyString + jsonmodel.swiftStringProperty(subPropertyName);
                        }else if (typeof(firstObject) === 'number' || typeof(firstObject) === 'boolean') {
                            swiftPropertyString = swiftPropertyString + swiftInt(subPropertyName);
                        }else if (typeof(firstObject) === 'object') {
                            var subBinName = subClassName+"Item";
                            swiftPropertyString = swiftPropertyString + swiftList(subPropertyName, subBinName);

                            var swiftString = swiftClassHeader(subBinName) + generateSwiftContent(subObject, subKey) + swiftClassTail();

                            if (jsonmodel.swiftSubString.length > 0) {
                                jsonmodel.swiftSubString = jsonmodel.swiftSubString + "\r\n" + swiftString;
                            }else {
                                jsonmodel.swiftSubString = swiftString;
                            }

                        }

                    }else if (jsonmodel.isMap(subObject)) {

                        var swiftString = swiftClassHeader(jsonmodel.uppercaseFirstLetter(subPropertyName)) + generateSwiftContent(subObject, subKey) + swiftClassTail();

                        if (jsonmodel.swiftSubString.length > 0) {
                            jsonmodel.swiftSubString = jsonmodel.swiftSubString + "\r\n" + swiftString;
                        }else {
                            jsonmodel.swiftSubString = swiftString;
                        }

                    }else if (typeof(subObject) === 'string') {
                        swiftPropertyString = swiftPropertyString + swiftStringProperty(subPropertyName);
                    }else if (typeof(subObject) === 'number') {
                        var str = subObject.toString();
                        if (str.indexOf('.') >= 0) {
                            swiftPropertyString = swiftPropertyString + swiftFloat(subPropertyName);
                        }else {
                            swiftPropertyString = swiftPropertyString + swiftInt(subPropertyName);
                        }
                    }else if (typeof(subObject) === 'boolean') {
                        swiftPropertyString = swiftPropertyString + swiftBool(subPropertyName);
                    }

                }
            }else {
                alert("key = "+key)
            }

            return swiftPropertyString;
        }

        this.clearContent();
        this.preProcess();

        var fileName = document.getElementById("fileName").value.trim();
        var jsonStr = editor_json.getValue();
        var obj =  eval('(' + jsonStr + ')');
        generateSwiftFile(obj, jsonmodel.uppercaseFirstLetter(fileName));
    },


    clearContent : function () {
        document.getElementById("result-container").removeAttribute("class");
        document.getElementById("precode").innerHTML = "";
    },

    downloadFile : function () {
        var fileName = jsonmodel.uppercaseFirstLetter(document.getElementById("fileName").value.trim());
        if (fileName.length == 0) {
            fileName = 'ModelName';
        }
        if (jsonmodel.classHeaderString.length >0 && jsonmodel.classImplementString.length > 0) {
            var zip = new JSZip();

            zip.file(fileName+".h", jsonmodel.classHeaderString);
            zip.file(fileName+".m", jsonmodel.classImplementString);

            // downloadContent = zip.generate();
            // window.location.href="data:application/zip;base64," + downloadContent;

            zip.generateAsync({type:"blob"}).then(function(downloadContent) {
                saveAs(downloadContent, fileName+".zip");
            });
        }else if (jsonmodel.javaBinString.length > 0) {
            //directly download java file
            data = [];
            data.push(jsonmodel.javaSubBin + "\r\n" + jsonmodel.javaBinString);
            properties = {type: 'plain/text'}; // Specify the file's mime-type.
            try {
                // Specify the filename using the File constructor, but ...
                file = new File(data, fileName + ".java", properties);
            } catch (e) {
                // ... fall back to the Blob constructor if that isn't supported.
                file = new Blob(data, properties);
            }
            url = URL.createObjectURL(file);
            location.href = url;
        }else if (jsonmodel.swiftString.length > 0) {
            data = [];
            data.push(jsonmodel.swiftSubString + "\r\n" + jsonmodel.swiftString);
            properties = {type: 'plain/text'}; // Specify the file's mime-type.
            try {
                // Specify the filename using the File constructor, but ...
                file = new File(data, fileName + ".swift", properties);
            } catch (e) {
                // ... fall back to the Blob constructor if that isn't supported.
                file = new Blob(data, properties);
            }
            url = URL.createObjectURL(file);
            location.href = url;
        }else {
            clearContent();
            document.getElementById("result-container").setAttribute("class", "shown");
            document.getElementById("result").innerHTML = "there is nothing to download!";
            document.getElementById("result").className = "error";
        }
    }
}
