修复 GitHub Release 自动 Source code (.zip) 和 Code → Download ZIP 安装版本更新时，因与发布源码包换行符不同而误报“本地文件已修改”的问题。更新改用原提交的 GitHub 源码归档校验，仍保护真正的本地修改；git clone 和 avas-source.zip 的更新方式不变。
