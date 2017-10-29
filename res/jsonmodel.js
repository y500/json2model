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

function uppercaseFirstLetter(string) {
	var newStr = string.replace(/\b[a-z]/g, function(letter) {
    				return letter.toUpperCase();
	});
	return newStr;
}

function lowercaseFirstLetter(string) {
	var newStr = string.replace(/\b[a-z]/g, function(letter) {
    				return letter.toLowerCase();
	});
	return newStr;
}

function isArray(object) {
    if (object instanceof Object) {
        return object.constructor.prototype.hasOwnProperty('push');
    }
    return false;
}

function isMap(object) {
    if (object instanceof Object) {
        return !object.constructor.prototype.hasOwnProperty('push');
    }
    return false;
}

var classHeaderString='';
var classImplementString ='';
var javaBinString='';
var javaSubBin='';
var swiftString='';
var swiftSubString='';

function clearGeneratedString() {
    classHeaderString ='';
    classImplementString='';
    javaBinString='';
    javaSubBin='';
    swiftString='';
    swiftSubString='';
}

function generateFile(json, fileName) {
	clearGeneratedString();

	if (fileName.length == 0) {
		fileName = 'ModelName';
	}

	var propertyContent = generateContent(json, fileName);

	if (classHeaderString.length > 0) {
        classHeaderString = classHeaderString+"\r\n\r\n"+interface(fileName, propertyContent);
    }else {
        classHeaderString = interface(fileName, propertyContent);
    }

    if (classImplementString.length > 0) {
        classImplementString = classImplementString+"\r\n\r\n"+implement(fileName);
    }else {
        classImplementString = implement(fileName);
    }

	javaBinString = javaClassHeader(fileName)+propertyContent;

	var headerCode = document.createElement("pre");
	headerCode.setAttribute("id", "headCode");
	headerCode.setAttribute("class", "model-result prettyprint lang-m");
    headerCode.append(classHeaderString);

	document.getElementById('precode').appendChild(headerCode)


    var implementCode = document.createElement("pre");
    implementCode.setAttribute("id", "implementCode");
    implementCode.setAttribute("class", "model-result prettyprint lang-m");
    implementCode.append(classImplementString);

    document.getElementById('precode').appendChild(implementCode)

    prettyPrint();
	//document.getElementById('model').value=classHeaderString+classImplementString;
}

function generateContent(object, key) {
	var propertyString = '';

	if (Array.isArray(object)) {
		if (object.length > 0) {
			var array = object;
			if (array.length > 0) {
				var tmpobject = array[0];
				for (var i = array.length - 1; i >= 0; i--) {
					var subObject = array[i];
					if (isArray(subObject)) {
						if (subObject.length > tmpobject.length) {
							tmpobject = subObject;
						}
					}else if (isMap(subObject)) {
                        if (Object.keys(subObject).length > Object.keys(tmpobject).length) {
                            tmpobject = subObject;
                        }
                    }
				}
                propertyString = propertyString+generateContent(tmpobject, key);
			}
		}
	}else if (isMap(object)) {
		for (var subKey in object) {
			subObject = object[subKey];
			var subClassName = uppercaseFirstLetter(subKey);
			var subPropertyName = lowercaseFirstLetter(subKey);

			if (isArray(subObject)) {

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
					if (classHeaderString.length > 0) {
                        classHeaderString = classHeaderString + "\r\n\r\n" + interface(subModelItemName, subPropertyString);
                    }else {
                        classHeaderString = interface(subModelItemName, subPropertyString);
                    }
                    if (classImplementString.length > 0) {
                        classImplementString = classImplementString + "\r\n\r\n" + implement(subModelItemName);
                    }else {
                        classImplementString = implement(subModelItemName);
                    }
				}


			}else if (isMap(subObject)) {
				var subPropertyString = generateContent(subObject, subKey);

				propertyString = propertyString + strongProperty(subClassName, subPropertyName);

				if (classHeaderString.length > 0) {
                    classHeaderString = classHeaderString + "\r\n\r\n" + interface(subClassName, subPropertyString);
                }else {
                    classHeaderString = interface(subClassName, subPropertyString);
                }

                if (classImplementString.length > 0) {
                    classImplementString = classImplementString + "\r\n\r\n" + implement(subClassName);
                }else {
                    classImplementString = implement(subClassName);
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

function generateJavaFile(json, fileName) {
    clearGeneratedString();

    if (fileName.length == 0) {
        fileName = 'ModelName';
    }

    var propertyContent = generateJavaContent(json, fileName);

    javaBinString = javaClassHeader(fileName)+propertyContent+javaClassTail();

    var javaResult = javaBinString;
    if (javaSubBin.length > 0) {
        javaResult = javaSubBin + "\r\n" + javaBinString;
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

    if (Array.isArray(object)) {
        if (object.length > 0) {
            var array = object;
            if (array.length > 0) {
                var tmpobject = array[0];
                for (var i = array.length - 1; i >= 0; i--) {
                    var subObject = array[i];
                    if (isArray(subObject)) {
                        if (subObject.length > tmpobject.length) {
                            tmpobject = subObject;
                        }
                    }else if (isMap(subObject)) {
                        if (Object.keys(subObject).length > Object.keys(tmpobject).length) {
                            tmpobject = subObject;
                        }
                    }
                }
                javaPropertyString = javaPropertyString+generateJavaContent(tmpobject, key);
            }
        }
    }else if (isMap(object)) {
        for (var subKey in object) {
            subObject = object[subKey];
            var subClassName = uppercaseFirstLetter(subKey);
            var subPropertyName = lowercaseFirstLetter(subKey);

            if (isArray(subObject)) {

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

					if (javaSubBin.length > 0) {
                        javaSubBin = javaSubBin + "\r\n" + subJavaString;
                    }else {
                        javaSubBin = subJavaString;
                    }

                }

            }else if (isMap(subObject)) {

                var subJavaString = javaClassHeader(uppercaseFirstLetter(subPropertyName)) + generateJavaContent(subObject, subKey) + javaClassTail();

                if (javaSubBin.length > 0) {
                    javaSubBin = javaSubBin + "\r\n" + subJavaString;
                }else {
                    javaSubBin = subJavaString;
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

function generateSwiftFile(json, fileName) {
    clearGeneratedString();

    if (fileName.length == 0) {
        fileName = 'ModelName';
    }

    var propertyContent = generateSwiftContent(json, fileName);

    swiftString = swiftClassHeader(fileName)+propertyContent+swiftClassTail();

    var swiftResult = swiftString;
    if (swiftSubString.length > 0) {
        swiftResult = swiftSubString + "\r\n" + swiftString;
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

    if (Array.isArray(object)) {
        if (object.length > 0) {
            var array = object;
            if (array.length > 0) {
                var tmpobject = array[0];
                for (var i = array.length - 1; i >= 0; i--) {
                    var subObject = array[i];
                    if (isArray(subObject)) {
                        if (subObject.length > tmpobject.length) {
                            tmpobject = subObject;
                        }
                    }else if (isMap(subObject)) {
                        if (Object.keys(subObject).length > Object.keys(tmpobject).length) {
                            tmpobject = subObject;
                        }
                    }
                }
                swiftPropertyString = swiftPropertyString+generateSwiftContent(tmpobject, key);
            }
        }
    }else if (isMap(object)) {
        for (var subKey in object) {
            subObject = object[subKey];
            var subClassName = uppercaseFirstLetter(subKey);
            var subPropertyName = lowercaseFirstLetter(subKey);

            if (isArray(subObject)) {

                var firstObject;
                var subSwiftPropertyString;

                if (subObject.length > 0) {
                    firstObject = subObject[0];
                }

                if (typeof(firstObject) === 'string') {
                    swiftPropertyString = swiftPropertyString + swiftStringProperty(subPropertyName);
                }else if (typeof(firstObject) === 'number' || typeof(firstObject) === 'boolean') {
                    swiftPropertyString = swiftPropertyString + swiftInt(subPropertyName);
                }else if (typeof(firstObject) === 'object') {
                    var subBinName = subClassName+"Item";
                    swiftPropertyString = swiftPropertyString + swiftList(subPropertyName, subBinName);

                    var subSwiftString = swiftClassHeader(subBinName) + generateSwiftContent(subObject, subKey) + swiftClassTail();

                    if (swiftSubString.length > 0) {
                        swiftSubString = swiftSubString + "\r\n" + subSwiftString;
                    }else {
                        swiftSubString = subSwiftString;
                    }

                }

            }else if (isMap(subObject)) {

                var subSwiftString = swiftClassHeader(uppercaseFirstLetter(subPropertyName)) + generateSwiftContent(subObject, subKey) + swiftClassTail();

                if (swiftSubString.length > 0) {
                    swiftSubString = swiftSubString + "\r\n" + subSwiftString;
                }else {
                    swiftSubString = subSwiftString;
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

function convertModel() {
	var fileName = document.getElementById("fileName").value.trim();
    var jsonStr = editor_json.getValue();
    console.log(jsonStr);
    var obj =  eval('(' + jsonStr + ')');
    console.log(obj);
    generateFile(obj, uppercaseFirstLetter(fileName));
}

function convertJavaBean() {
    var fileName = document.getElementById("fileName").value.trim();
    var jsonStr = editor_json.getValue();
    console.log(jsonStr);
    var obj =  eval('(' + jsonStr + ')');
    console.log(obj);
    generateJavaFile(obj, uppercaseFirstLetter(fileName));
}

function convertSwiftModel() {
    var fileName = document.getElementById("fileName").value.trim();
    var jsonStr = editor_json.getValue();
    console.log(jsonStr);
    var obj =  eval('(' + jsonStr + ')');
    console.log(obj);
    generateSwiftFile(obj, uppercaseFirstLetter(fileName));
}

function clearContent() {
    document.getElementById("result-container").removeAttribute("class");
    document.getElementById("precode").innerHTML = "";
}

function preProcess() {
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
}

function downloadFile() {
    var fileName = uppercaseFirstLetter(document.getElementById("fileName").value.trim());
    if (fileName.length == 0) {
        fileName = 'ModelName';
    }
    if (classHeaderString.length >0 && classImplementString.length > 0) {
        var zip = new JSZip();

        zip.file(fileName+".h", classHeaderString);
        zip.file(fileName+".m", classImplementString);

        // downloadContent = zip.generate();
        // window.location.href="data:application/zip;base64," + downloadContent;

        zip.generateAsync({type:"blob"}).then(function(downloadContent) {
            saveAs(downloadContent, fileName+".zip");
        });
    }else if (javaBinString.length > 0) {
        //directly download java file
        data = [];
        data.push(javaSubBin + "\r\n" + javaBinString);
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
    }else if (swiftString.length > 0) {
        data = [];
        data.push(swiftSubString + "\r\n" + swiftString);
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