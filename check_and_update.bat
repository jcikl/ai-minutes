@echo off
echo =================================
echo 检查项目状态并更新到 GitHub
echo =================================

echo.
echo 1. 检查当前工作目录:
cd

echo.
echo 2. 检查 git 状态:
git status --porcelain

echo.
echo 3. 检查未提交的更改:
git diff --name-only

echo.
echo 4. 检查当前分支:
git branch --show-current

echo.
echo 5. 检查远程状态:
git remote -v

echo.
echo 6. 检查是否有需要推送的提交:
git log --oneline @{u}..HEAD

echo.
echo 7. 添加所有更改:
git add .

echo.
echo 8. 检查暂存状态:
git status --porcelain

echo.
echo 9. 提交更改 (如果有):
git diff --cached --quiet || git commit -m "深度检查后的代码更新"

echo.
echo 10. 推送到 GitHub:
git push origin master

echo.
echo 11. 最终状态检查:
git status

echo.
echo =================================
echo 操作完成
echo =================================
